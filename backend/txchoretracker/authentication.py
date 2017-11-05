import time
import json
import hmac

import attr
import treq
from google.oauth2 import id_token as google_id_token
from google.auth import transport as google_auth_transport


class CrappyAuthenticationPolicy:
    def getAuthenticatedUserId(self, request):
        return 1


class AuthTicketAuthenticationPolicy:
    def __init__(
                self,
                *,
                cookieDomain: str,
                secret: bytes,
                digestmod='sha512',
                reauthPeriod=3600 * 24,  # Default to 1 day
                cookiePath: str = None,
                cookieName='AUTHTKT',
                cookieSecure=True,
            ):
        self._serializer = SignedJSONSerializer(
            secret=secret,
            digestmod=digestmod)
        self._addCookieKeywords = {
            'domain': cookieDomain,
            'path': cookiePath,
            'max_age': reauthPeriod,
            'secure': cookieSecure,
            'httpOnly': True,
        }
        self._reauthPeriod = reauthPeriod
        self._cookieName = cookieName

    def rememberUser(self, txRequest, userId):
        """
        Set a signed cookie on the outgoing response with the userId
        and the current time (as an integer unix timestamp).
        """
        structure = {
            'userId': userId,
            'authenticatedAt': int(time.time())
        }
        cookiePayload = self._serializer.serializeWithSignature(structure)
        txRequest.addCookie(
            self._cookieName, cookiePayload, **self._addCookieKeywords)


    def getAuthenticatedUserId(self, request):
        """
        Ensure that the auth cookie has not expired and the signature
        matches, and return the user id or None if the checks fail.

        ``request`` here is the JSONApiRequest given to route handlers.
        """
        cookiePayload = request.getCookie(self._cookieName)
        if cookiePayload is None:
            return None
        try:
            deserialized = self._serializer.deserializeVerifyingSignature(
                cookiePayload)
        except SignedJSONSerializerError:
            return None
        sinceAuth = int(time.time()) - deserialized.get('authenticatedAt', 0)
        if sinceAuth > self._reauthPeriod:
            return None
        return deserialized['userId']



class SignedJSONSerializer:
    """
    Supports serialization of a mapping to a signed JSON payload.

    Keys must be strings, values can be strings or ints.
    """
    def __init__(self, *, secret: bytes, digestmod):
        self._secret = secret
        self._digestmod = digestmod

    def serializeWithSignature(self, dataStructure: dict) -> bytes:
        """
        Serialize ``dataStructure`` to an ascii-only JSON payload
        with a hex signature appended.
        """
        payload = json.dumps(dataStructure, ensure_ascii=True).encode('ascii')
        hexmac = hmac.new(
            self._secret,
            payload,
            digestmod=self._digestmod,
        ).hexdigest()
        return '{0};mac={1}'.format(serialized, hexmac).encode('ascii')

    def deserializeVerifyingSignature(self, serialized: bytes):
        """
        Deserialize a payload produced by
        :meth:`serializeWithSignature` and verify the signature.

        Raises:
            FormatMismatch:
                if the serialized payload could not be properly
                parsed.
            SignatureMismatch:
                if the MAC doesn't match up with the payload.

        """
        payload, sep, hexmac = serialized.rpartition(b':mac=')
        if not sep:
            raise FormatMismatch('Missing separator')
        calculated_hexmac = hmac.new(
            self._secret,
            payload,
            digestmod=self._digestmod,
        ).hexdigest().encode('ascii')
        if not hmac.compare_digest(hexmac, calculated_hexmac):
            raise SignatureMismatch
        return json.loads(payload)


class SignedJSONSerializerError(Exception):
    pass


class FormatMismatch(SignedJSONSerializerError):
    pass


class SignatureMismatch(SignedJSONSerializerError):
    pass




# https://developers.google.com/identity/sign-in/web/backend-auth
# It looks like google.oauth2.verify_oauth2_token just uses
# the passed-in request to grab the Google certificates for
# verification... So if I pre-grab those and just make the
# passed-in request check the URL matches what's expected,
# it should be good enough to use the lib.
#
# The URL that provides public certificates for verifying ID tokens issued
# by Google's OAuth 2.0 authorization server.
_GOOGLE_OAUTH2_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs'


class GoogleSignInValidator:
    _CERTS_MAX_AGE = 3600

    def __init__(self, googleAppClientId):
        self._googleAppClientId = googleAppClientId
        self._certsRetrievedAt = 0
        self._request_fake = None

    async def validateUserIdFromToken(self, token):
        """
        Validate a Google Sign In ID token and return the associated
        Google user ID.
        """
        certsRequestFake = await self._makeGoogleAuthCertsRequestFake()
        try:
            idinfo = google_id_token.verify_oauth2_token(
                token, certsRequestFake, self._googleAppClientId)

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            # If auth request is from a G Suite domain:
            # if idinfo['hd'] != GSUITE_DOMAIN_NAME:
            #     raise ValueError('Wrong hosted domain.')

            # ID token is valid. Get the user's Google Account ID from the decoded token.
            googleUserId = idinfo['sub']
        except ValueError as e:
            raise InvalidGoogleSignInIdToken(e)

        return googleUserId

    async def _makeGoogleAuthCertsRequestFake(self):
        # FIXME: This is not resilient in the face of system clock changes
        if not self._request_fake or time.time() - self._certsRetrievedAt > self._CERTS_MAX_AGE:
            response = await treq.get(_GOOGLE_OAUTH2_CERTS_URL)
            status = response.code
            headers = {
                key.decode('ascii'): value.decode('utf-8')
                for key, value in response.headers.getAllRawHeaders()
            }
            body = await treq.content(response)
            self._request_fake = _GoogleOAuth2CertsRequestFake(
                status, headers, body)
            self._certsRetrievedAt = time.time()

        return self._request_fake


class InvalidGoogleSignInIdToken(Exception):
    pass


class _GoogleOAuth2CertsRequestFake(google_auth_transport.Request):
    def __init__(
            self, response_status_code,
            response_headers_dict, certs_response_bytes):
        self._response_status_code = response_status_code
        self._response_headers_dict = response_headers_dict
        self._response_body_bytes = certs_response_bytes

    def __call__(
            self, url, method='GET', body=None, headers=None, timeout=None,
            **kwargs):
        if url != _GOOGLE_OAUTH2_CERTS_URL:
            raise Exception('Expected certs url {0} but got {1}'.format(
                _GOOGLE_OAUTH2_CERTS_URL, url))
        if method != 'GET':
            raise Exception('Expected GET method but got {0}'.format(method))

        return _GoogleOAuth2CertsResponse(
            self._response_status_code,
            self._response_headers_dict,
            self._response_body_bytes)


@attr.s
class _GoogleOAuth2CertsResponse(google_auth_transport.Response):
    status = attr.ib()
    headers = attr.ib()
    data = attr.ib()
