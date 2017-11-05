"""
Helpers to make writing Klein code nicer for this JSON API.
"""
import json
import functools
import types
import urllib.parse

import attr
import zope.interface
import werkzeug.routing
import klein
from twisted import logger
from twisted.internet import defer
from twisted.web.resource import IResource
from twisted.web.server import NOT_DONE_YET


log = logger.Logger()


_SUCCESS_CODES = frozenset({200, 201})
_FAILURE_CODES = frozenset({400, 403, 404, 405})
assert _SUCCESS_CODES.isdisjoint(_FAILURE_CODES)
_ALLOWED_CODES = _SUCCESS_CODES.union(_FAILURE_CODES)


class JSONApiRouter:
    def __init__(self, kleinRouter):
        self.kleinRouter = kleinRouter
        self.kleinRouter.url_map.converters['pgbigserial'] = \
            _PostgreSQLBigSerialConverter
        self._authPolicy = None

    def injectAuthPolicy(self, authPolicy):
        if self._authPolicy is not None:
            raise RuntimeError('Already added an auth policy')
        self._authPolicy = authPolicy

    def route(self, *routeArgs, requiresAuth=True, **routeKeywords):
        """
        Add a method as a route handler, with goodies.

        The incoming :class:`twisted.web.server.Request` object
        will be wrapped in :class:`JSONApiRequest`.

        If requiresAuth is True (the default), the request will be
        rejected with a 403 Forbidden unless the auth policy has
        authenticated the user.
        """
        # Stop werkzeug's trailing slash redirect behavior.
        routeKeywords['strict_slashes'] = False

        def decorator(handlerFunction):
            if requiresAuth:
                handlerFunction = self._protect(handlerFunction)
            # Wrap with translate request _after_ anything else, so the
            # previous wrappers will get the JSONApiRequest instead of
            # the twisted one.
            handlerFunction = self._translateRequest(handlerFunction)
            wrapRoute = self.kleinRouter.route(*routeArgs, **routeKeywords)
            return wrapRoute(handlerFunction)
        return decorator

    def _translateRequest(self, handlerFunction):
        @functools.wraps(handlerFunction)
        def wrapTXRequest(instance, txRequest, **kwargs):
            request = JSONApiRequest(txRequest, self._authPolicy)
            return handlerFunction(instance, request, **kwargs)
        return wrapTXRequest

    def _protect(self, handlerFunction):
        @functools.wraps(handlerFunction)
        def ensureUserIdOr403(instance, request, **kwargs):
            if request.authenticatedUserId is None:
                return JSONResponseResource.makeForbidden()
            return handlerFunction(instance, request, **kwargs)
        return ensureUserIdOr403


_MAX_POSTGRES_BIGINT = 9223372036854775807

def _PostgreSQLBigSerialConverter(*args, **kwargs):
    return werkzeug.routing.IntegerConverter(
        *args, **kwargs, min=1, max=_MAX_POSTGRES_BIGINT)


class JSONApiRequest:
    """
    Wrapper for the *request* part of
    :class:`twisted.web.server.Request`.

    Attributes:
        method (str):
            The request method as a unicode object.
        query (dict of str, str):
            The query parameters as a dict of unicode -> unicode.
            Only the _last_ provided parameter value will be used.
        authenticatedUserId (int or None):
            The user ID gathered from the request via the
            authentication policy.
    """
    def __init__(self, txRequest, authPolicy):
        self.method = txRequest.method.decode('ascii')
        self.authenticatedUserId = authPolicy.getAuthenticatedUserId(txRequest)
        self._txRequest = txRequest

    @property
    def query(self):
        params = urllib.parse.parse_qs(
            urllib.parse.urlsplit(txRequest.uri).query.decode('ascii'),
        )
        # Memoize the query parameters
        self.query = {k: v[-1] for k, v in params.items()}
        return self.query

    def getCookie(self, cookieName: str):
        return self._txRequest.getCookie(cookieName.encode('ascii'))

    def getJSONContent(self):
        contentType = self._txRequest.getHeader(b'content-type')
        if contentType is None:
            raise MissingContentType
        if contentType.split(b';', 1)[0].rstrip() != b'application/json':
            raise NotJSONContent
        try:
            return json.loads(self._txRequest.content.read())
        except ValueError:
            raise InvalidJSONContent


@zope.interface.implementer(IResource)
@attr.s
class JSONResponseResource:
    """
    A :class:`twisted.web.resource.IResource` that renders a JSON
    response.

    Attributes:
        structure (dict or list):
            The JSON-serializable structure used for the response body.
            If the status code is 200 or 201, this structure is
            serialized at the "data" key, otherwise it is considered
            the error structure and serialized at the "error" key.
        status (int):
            HTTP status code (default 200)
        txRequestCallback (callable or None):
            A callable of one argument that takes the
            :class:`twisted.web.server.Request` instance and modifies
            it as necessary. Will be called before writing the body
            and finalizing the response, as long as the structure
            is valid.
    """
    structure = attr.ib(
        validator=attr.validators.instance_of((list, dict)),
    )
    status = attr.ib(
        default=200,
        validator=attr.validators.in_(_ALLOWED_CODES),
    )
    txRequestCallback = attr.ib(
        default=None,
        validator=attr.validators.optional(
            attr.validators.instance_of((types.FunctionType, types.MethodType))
        )
    )

    @classmethod
    def makeNotFound(cls, message : str = 'not found'):
        return cls(
            {'message': message},
            status=404,
        )

    @classmethod
    def makeForbidden(cls, message : str = 'forbidden'):
        return cls(
            {'message': message},
            status=403,
        )

    @classmethod
    def makeBadRequest(cls, message : str = 'bad request'):
        return cls(
            {'message': message},
            status=400,
        )

    @classmethod
    def makeInternalServerError(cls, message : str = 'internal server error'):
        return cls(
            {'message': message},
            status=500,
        )

    ### IResource methods
    def render(self, txRequest):
        dfd = defer.execute(self._respond, txRequest)
        dfd.addErrback(self._respondOnUnhandledException, txRequest=txRequest)

        return NOT_DONE_YET

    def _respond(self, txRequest):
        if self.status in _SUCCESS_CODES:
            bodyStructure = {
                'status': self.status,
                'data': self.structure,
            }
        elif self.status in _FAILURE_CODES:
            bodyStructure = {
                'status': self.status,
                'error': self.structure,
            }
        else:
            raise ValueError(
                'Unexpected response status code {0}'.format(self.status))
        data = _makeJSONBytes(bodyStructure)
        txRequest.setResponseCode(self.status)
        txRequest.setHeader(b'Content-Type', b'application/json')
        if self.txRequestCallback is not None:
            self.txRequestCallback(txRequest)
        txRequest.write(data)
        txRequest.finish()

    def _respondOnUnhandledException(self, failure, *, txRequest):
        """
        Last resort: log the failure, and respond with 500 and a
        generic message.
        """
        log.failure(
            'Unhandled error in render of response to {method} {uri}',
            method=txRequest.method.decode('ascii'),
            uri=txRequest.uri.decode('utf-8'),
            failure=failure,
        )
        data = _makeJSONBytes({
            'status': 500,
            'error': {'message': 'internal server error'},
        })
        txRequest.setResponseCode(500)
        txRequest.setHeader(b'Content-Type', b'application/json')
        txRequest.write(data)
        txRequest.finish()

    isLeaf = True

    def getChildWithDefault(self, name, request):
        # Since isLeaf is true, this shouldn't be called anyway.
        raise NotImplementedError('getChildWithDefault not supported')

    def putChild(self, path, child):
        raise NotImplementedError('putChild not supported')


def _makeJSONBytes(structure):
    return json.dumps(structure, ensure_ascii=True).encode('ascii')
