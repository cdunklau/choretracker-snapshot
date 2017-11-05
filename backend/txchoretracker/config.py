import urllib.parse
import configparser

import attr
import attr.validators


@attr.s
class RestApiConfig:
    """
    The [restapi] section of the config file.

    Attributes:
        development:
            If we are in development mode.

            -   Sets session cookie "secure" mode to False so
                the browser will allow the cookie to be sent
                over plaintext HTTP.
            -   Mounts the API routes at /apis/ instead of /
                so the React dev server proxy will work.

        cookie_secret:
            TODO: This doesn't actually do anything and will probably
            change!

            Base64-encoded Fernet key, used to encrypt session
            cookie contents.

            **This must remain secret!**

            Can be generated with::

                from cryptography.fernet import Fernet
                print(Fernet.generate_key().decode('ascii'))

        domain:
            The domain the application is running on.
            Use "localhost" for local development.
    """
    development: bool = attr.ib()
    cookie_secret: str = attr.ib(
        validator=attr.validators.instance_of(str),
    )
    domain: str = attr.ib()


@attr.s
class DatabaseConfig:
    """
    The [postgresql] section of the config file.
    """
    dbname: str = attr.ib()
    host: str = attr.ib(default=None)
    username: str = attr.ib(default=None)
    password: str = attr.ib(default=None, repr=False)

    def get_dsn(self):
        if self.host is None:
            return 'postgres:///{0}'.format(
                urllib.parse.quote(self.dbname),
            )
        scheme = 'postgres'
        netloc = self.host  # TODO: Support username, password, and port
        path = '/' + self.dbname
        parameters = ''
        query = ''  # TODO: Support query params
        fragment = ''
        return urllib.parse.urlunparse(
            (scheme, netloc, path, parameters, query, fragment)
        )


@attr.s
class ApplicationConfig:
    db: DatabaseConfig = attr.ib(
        validator=attr.validators.instance_of(DatabaseConfig)
    )
    restapi: RestApiConfig = attr.ib(
        validator=attr.validators.instance_of(RestApiConfig)
    )


def processConfigFile(configFilePath):
    parser = configparser.RawConfigParser()
    with open(configFilePath, 'r', encoding='utf-8') as configFile:
        parser.read_file(configFile)
    restapiSection = parser['restapi']
    restapi = RestApiConfig(
        development=restapiSection.getboolean('development', fallback=False),
        domain=restapiSection['domain'],
        cookie_secret=restapiSection['cookie_secret'],
    )
    return ApplicationConfig(
        db=DatabaseConfig(**parser['postgresql']),
        restapi=restapi,
    )
