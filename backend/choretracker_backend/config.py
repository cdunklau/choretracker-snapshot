import urllib.parse
import configparser

import attr
import attr.validators


def read_config(config_file):
    parser = configparser.RawConfigParser()
    with config_file:
        parser.read_file(config_file)
    general = GeneralConfig(
        development=parser.getboolean('general', 'development', fallback=False),
    )
    return ApplicationConfig(
        db=DatabaseConfig(**parser['postgresql']),
        general=general,
    )


@attr.s
class DatabaseConfig:
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
class GeneralConfig:
    development: bool = attr.ib()


@attr.s
class ApplicationConfig:
    db: DatabaseConfig = attr.ib(
        validator=attr.validators.instance_of(DatabaseConfig)
    )
    general: GeneralConfig = attr.ib(
        validator=attr.validators.instance_of(GeneralConfig)
    )

