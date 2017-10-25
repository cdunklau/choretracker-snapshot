import sys
import time
import logging
import asyncio

import attr
import aiohttp as client
import aiohttp.web as server
from google.oauth2 import id_token as google_id_token
from google.auth import transport as google_auth_transport

# It looks like google.oauth2.verify_oauth2_token just uses
# the passed-in request to grab the Google certificates for
# verification... So if I pre-grab those and just make the
# passed-in request check the URL matches what's expected,
# it should be good enough to use the lib.

# The URL that provides public certificates for verifying ID tokens issued
# by Google's OAuth 2.0 authorization server.
_GOOGLE_OAUTH2_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs'


log = logging.getLogger(__name__)


class GoogleSignInValidator:
    _CERTS_MAX_AGE = 3600

    def __init__(self, client_session, client_id):
        self._session = client_session
        self._google_app_client_id = client_id
        self._certs_retrieved = 0
        self._request_fake = None

    async def _make_google_auth_certs_request_fake(self):
        # FIXME: This is not resilient in the face of system clock changes
        if not self._request_fake or time.time() - self._certs_retrieved > self._CERTS_MAX_AGE:
            async with self._session.get(_GOOGLE_OAUTH2_CERTS_URL) as resp:
                body = await resp.read()
                status = resp.status
                headers = dict(resp.headers)
            self._request_fake = _GoogleOAuth2CertsRequestFake(
                status, headers, body)
            self._certs_retrieved = time.time()

        return self._request_fake

    async def validate_user_id_from_token(self, token):
        certs_request_fake = await self._make_google_auth_certs_request_fake()
        try:
            idinfo = google_id_token.verify_oauth2_token(
                token, certs_request_fake, self._google_app_client_id)

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            # If auth request is from a G Suite domain:
            # if idinfo['hd'] != GSUITE_DOMAIN_NAME:
            #     raise ValueError('Wrong hosted domain.')

            # ID token is valid. Get the user's Google Account ID from the decoded token.
            userid = idinfo['sub']
        except ValueError as e:
            raise InvalidToken(e)

        return userid


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


def serve_html(request):
    return server.Response(
        body=request.app['html_bytes'],
        content_type='text/html',
    )


async def handle_auth_token(request):
    idtoken = (await request.json())['idtoken']
    google_validator = request.app['google_sign_in']
    try:
        user_id = await google_validator.validate_user_id_from_token(idtoken)
    except Exception:
        log.exception('failed to validate idtoken')
        return server.Response(status=400)

    log.info('token is valid, user id is {0!r}'.format(user_id))
    return server.json_response({'validated_user_id': user_id})



async def build_app(client_id):
    app = server.Application()

    with open('googlesignin-test.html', 'rb') as fp:
        app['html_bytes'] = fp.read().replace(
            b'%%%REPLACE_WITH_CLIENT_ID%%%',
            client_id.encode('ascii')
        )

    client_session = client.ClientSession()
    async def close_client(theapp):
        await client_session.close()
    app.on_cleanup.append(close_client)

    app['google_sign_in'] = GoogleSignInValidator(client_session, client_id)

    app.router.add_get('/', serve_html)
    app.router.add_post('/googleauthtoken', handle_auth_token)

    return app


def main():
    client_id = sys.argv[1]
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    loop = asyncio.get_event_loop()
    app = loop.run_until_complete(build_app(client_id))
    server.run_app(app, port=4000)


if __name__ == '__main__':
    main()
