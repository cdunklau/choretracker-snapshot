import sys

import click
import psycopg2

from txchoretracker.config import processConfigFile


@click.group()
@click.option(
    '-c', '--config-file',
    type=click.Path(exists=True),
    required=True,
)
@click.pass_context
def cli(ctx, config_file):
    ctx.obj['config'] = processConfigFile(config_file)


# TODO: Add a command routine to init database (really it should run the
# migrations)


@cli.command(name='install-fixture')
@click.pass_context
def install_fixture(ctx):
    config = ctx.obj['config']
    conn = psycopg2.connect(config.db.get_dsn())
    with conn, conn.cursor() as cur:
        do_install_fixture(cur)


def do_install_fixture(cursor):
    cursor.execute('INSERT INTO "user" DEFAULT VALUES RETURNING id')
    [user_id] = cursor.fetchone()
    print('inserted user {0}'.format(user_id))
    cursor.execute('''
        INSERT INTO task_group
            (name, description, created, modified)
        VALUES
            (%s, '', now(), now())
        RETURNING id
    ''', ["User {0}'s task group".format(user_id)])
    [task_group_id] = cursor.fetchone()
    cursor.execute('''
        INSERT INTO users_m2m_task_groups
            (user_id, task_group_id) VALUES (%s, %s)
    ''', (user_id, task_group_id))
    day = 24 * 60 * 60
    tasks = [
        (
            'Clean Kitchen',
            -4 * day,
            '- Wash dishes\n- Wipe down surfaces\n- Sweep and mop'
        ),
        ('Change Car Oil', 30 * day, ''),
        ('Clean bathroom', 2 * day, 'Make sure to get under the toilet'),
    ]
    cursor.executemany('''
        INSERT INTO task
            (name, due, description, task_group_id, created, modified)
        VALUES
            (%s, to_timestamp(extract(epoch from now()) + %s), %s, %s, now(), now())
    ''', [t + (task_group_id,) for t in tasks])



def main():
    cli(obj={})


if __name__ == '__main__':
    main()
