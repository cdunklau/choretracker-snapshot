import sys
import asyncio
import logging

import aiohttp.web
import asyncpg
import click

from choretracker_backend.config import read_config
from choretracker_backend.app import build_app


@click.group()
@click.option(
    '-c', '--config-file',
    type=click.File('r', encoding='utf-8'),
    required=True,
)
@click.pass_context
def cli(ctx, config_file):
    ctx.obj['config'] = read_config(config_file)


@cli.command()
@click.pass_context
def serve(ctx):
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
    config = ctx.obj['config']
    loop = asyncio.get_event_loop()
    app = loop.run_until_complete(build_app(config=config, loop=loop))
    aiohttp.web.run_app(app)


@cli.command(name='install-fixture')
@click.pass_context
def install_fixture(ctx):
    config = ctx.obj['config']
    loop = asyncio.get_event_loop()
    conn = loop.run_until_complete(asyncpg.connect(config.db.get_dsn()))
    loop.run_until_complete(do_install_fixture(conn))


async def do_install_fixture(conn):
    user_id = await conn.fetchval('INSERT INTO "user" DEFAULT VALUES RETURNING id')
    print('inserted user {0}'.format(user_id))
    task_group_id = await conn.fetchval('''
        INSERT INTO task_group
            (name, description, created, modified)
        VALUES
            ($1, '', now(), now())
        RETURNING id
    ''', "User {0}'s task group".format(user_id))
    await conn.execute('''
        INSERT INTO users_m2m_task_groups
            (user_id, task_group_id) VALUES ($1, $2)
    ''', user_id, task_group_id)
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
    await conn.executemany('''
        INSERT INTO task
            (name, due, description, task_group_id, created, modified)
        VALUES
            ($1, to_timestamp(extract(epoch from now()) + $2), $3, $4, now(), now())
    ''', [t + (task_group_id,) for t in tasks])



def main():
    cli(obj={})
