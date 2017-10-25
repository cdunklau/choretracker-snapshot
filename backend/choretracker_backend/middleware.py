import json
import typing
import logging

from aiohttp import web

from choretracker_backend.typing import (
    JSONRequestHandler, JSONRequestHandlerResult
)


log = logging.getLogger(__name__)


async def json_middleware_factory(
            app: web.Application,
            handler: JSONRequestHandler
        ) -> typing.Callable[[web.Request], typing.Awaitable[web.Response]]:

    async def json_middleware_handler(request: web.Request) -> web.Response:
        try:
            handler_result = await handler(request)
            if isinstance(handler_result, web.HTTPException):
                raise handler_result
            if isinstance(handler_result, web.Response):
                raise TypeError(
                    'Handler {handler} returned Response instance, this is '
                    'not supported'.format(handler=handler)
                )
            return make_success_response(handler, handler_result)
        # TODO: Deal with application-level exceptions and
        #       return the error structure with a reasonable
        #       error message.
        except web.HTTPException as ex:
            if 200 <= ex.status < 400:
                # Success and redirect responses are not supported
                log.exception('handler raised a non-error http exception:')
                return make_generic_failure_response()
            return make_failure_response(
                status_code=ex.status,
                error_message=ex.reason,
            )
        except:
            # Can't handle what happened. Bail with 500 and a generic error.
            # TODO: Log the hell out of this.
            log.exception('unhandled handler exception:')
            return make_generic_failure_response()

    return json_middleware_handler


def make_failure_response(
            *,
            status_code: int,
            error_message: str
        ) -> web.Response:
    return web.Response(
        body=json.dumps({'code': status_code, 'error': error_message}),
        status=status_code,
        content_type='application/json',
    )


def make_generic_failure_response() -> web.Response:
    return make_failure_response(
        status_code=500,
        error_message='internal server error',
    )
    

def make_success_response(
            handler: JSONRequestHandler,
            handler_result: JSONRequestHandlerResult,
        ) -> web.Response:
    status_code = None
    if isinstance(handler_result, tuple):
        if len(handler_result) != 2:
            raise TypeError(
                'handler {handler} returned a tuple of length {length} '
                'but expected 2'.format(
                    handler=handler,
                    length=len(result)
                )
            )
        body_structure, status_code = handler_result
    else:
        body_structure = handler_result
    status_code = 200 if status_code is None else status_code
    if status_code not in {200, 201}:
        raise TypeError(
            'handler {handler} returned an unexpected status code '
            '{code}'.format(handler=handler, code=status_code)
        )
    if body_structure is None:
        body = json.dumps({'code': status_code, 'data': None})
    else:
        body = json.dumps({'code': status_code, 'data': body_structure})
    return web.Response(
        body=body,
        status=status_code,
        content_type='application/json',
    )
