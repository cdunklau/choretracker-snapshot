import sqlalchemy as sqla
from sqlalchemy.dialects import postgresql as pg

metadata = sqla.MetaData()

def _IDColumn():
    return sqla.Column(
        'id', sqla.BigInteger, primary_key=True, autoincrement=True)


task_group = sqla.Table(
    'task_group',
    metadata,
    _IDColumn(),
    sqla.Column('name', sqla.String, nullable=False),
    sqla.Column('description', sqla.String, nullable=False),
    # TODO: Figure out how to do server-side defaults right for this
    sqla.Column('created', sqla.DateTime(timezone=False), nullable=False),
    sqla.Column('modified', sqla.DateTime(timezone=False), nullable=False),
)

user = sqla.Table(
    'user',
    metadata,
    _IDColumn(),
)

user_profile = sqla.Table(
    'user_profile',
    metadata,
    sqla.Column('user_id', None, sqla.ForeignKey(user.c.id), primary_key=True),
    sqla.Column('email', sqla.String, nullable=False),
    sqla.Column('display_name', sqla.String, nullable=False),
    sqla.Column('email_verified', sqla.Boolean, nullable=False, default=False),
)

google_auth = sqla.Table(
    'google_auth',
    metadata,
    sqla.Column('google_uid', sqla.String, nullable=False, primary_key=True),
    sqla.Column(
        'user_id',
        None,
        sqla.ForeignKey(user.c.id),
        nullable=False,
        unique=True,
    ),
)

users_m2m_task_groups = sqla.Table(
    'users_m2m_task_groups',
    metadata,
    sqla.Column(
        'user_id',
        None,
        sqla.ForeignKey(user.c.id),
        nullable=False,
        primary_key=True
    ),
    sqla.Column(
        'task_group_id',
        None,
        sqla.ForeignKey(task_group.c.id),
        nullable=False,
        primary_key=True
    ),
)


task = sqla.Table(
    'task',
    metadata,
    _IDColumn(),
    sqla.Column(
        'task_group_id',
        None,
        sqla.ForeignKey(task_group.c.id),
        nullable=False
    ),
    sqla.Column('name', sqla.String, nullable=False),
    sqla.Column('description', sqla.String, nullable=False),
    sqla.Column('due', sqla.DateTime(timezone=False), nullable=False),
    # TODO: Figure out how to do server-side defaults right for this
    #       ...or maybe not, just do everything in PL/pgSQL.
    sqla.Column('created', sqla.DateTime(timezone=False), nullable=False),
    sqla.Column('modified', sqla.DateTime(timezone=False), nullable=False),
)


if __name__ == '__main__':
    from sqlalchemy import schema as sc
    for table in metadata.sorted_tables:
        ddl = str(sc.CreateTable(table).compile(dialect=pg.dialect())).strip()
        print(ddl + ';')
