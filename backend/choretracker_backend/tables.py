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
    sqla.Column('created', sqla.DateTime(timezone=False), nullable=False),
    sqla.Column('modified', sqla.DateTime(timezone=False), nullable=False),
)


if __name__ == '__main__':
    from sqlalchemy import schema as sc
    for table in metadata.sorted_tables:
        ddl = str(sc.CreateTable(table).compile(dialect=pg.dialect())).strip()
        print(ddl + ';')
