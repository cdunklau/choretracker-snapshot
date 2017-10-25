"""
Coroutine functions to bridge the model object <-> database gap.
"""
import os.path
import logging

import asyncpg

from choretracker_backend import models
from choretracker_backend import exceptions

log = logging.getLogger(__name__)

_here = os.path.abspath(os.path.dirname(__file__))
_plpgsql_functions_filepath = os.path.join(_here, 'functions.sql')


async def setup_dbpool(dbconfig):
    log.info('Creating connection pool')
    dbpool = await asyncpg.create_pool(dbconfig.get_dsn())
    with open(_plpgsql_functions_filepath, 'r', encoding='utf-8') as fp:
        install_functions = fp.read()
    log.info('Connecting to database')
    async with dbpool.acquire() as conn:
        log.info('Installing database functions')
        await conn.execute(install_functions)
    log.info('Database setup complete')
    return dbpool


async def user_fetch_all_tasks(conn, *, user_id):
    sql = 'SELECT * FROM api.user_fetch_all_tasks($1)'
    task_rows = await conn.fetch(sql, user_id)
    return [models.Task(**row) for row in task_rows]


async def user_fetch_task(conn, *, user_id, task_id):
    sql = 'SELECT * FROM api.user_fetch_task($1, $2)'
    try:
        task_row = await conn.fetchrow(sql, user_id, task_id)
    except asyncpg.RaiseError as e:
        if e.detail == 'NO_SUCH_TASK':
            raise exceptions.NoSuchTask
        if e.detail == 'USER_NOT_MEMBER_OF_TASK_GROUP':
            raise exceptions.UserNotInTaskGroup
        raise
    return models.Task(**task_row)


async def user_create_task(conn, *, user_id, task_to_create):
    sql = 'SELECT * FROM api.user_create_task($1, $2, $3, $4, $5)'
    params = (
        user_id, 
        task_to_create.task_group_id,
        task_to_create.name,
        task_to_create.description,
        task_to_create.due_unix
    )
    try:
        new_task_row = await conn.fetchrow(sql, *params)
    except asyncpg.RaiseError as e:
        if e.detail == 'USER_NOT_MEMBER_OF_REQUESTED_TASK_GROUP':
            raise exceptions.UserNotInRequestedTaskGroup
        raise
    return models.Task(**new_task_row)


async def user_update_task(conn, *, user_id, task_id, task_to_update):
    sql = 'SELECT * FROM api.user_update_task($1, $2, $3, $4, $5, $6)'
    params = (
        user_id,
        task_id,
        task_to_update.task_group_id,
        task_to_update.name,
        task_to_update.description,
        task_to_update.due_unix
    )
    try:
        updated_task_row = await conn.fetchrow(sql, *params)
    except asyncpg.RaiseError as e:
        if e.detail == 'NO_SUCH_TASK':
            raise exceptions.NoSuchTask
        if e.detail == 'USER_NOT_MEMBER_OF_TASK_GROUP':
            raise exceptions.UserNotInTaskGroup
        if e.detail == 'USER_NOT_MEMBER_OF_REQUESTED_TASK_GROUP':
            raise exceptions.UserNotInRequestedTaskGroup
        raise

    return models.Task(**updated_task_row)


async def user_delete_task(conn, *, user_id, task_id):
    sql = 'SELECT api.user_delete_task($1, $2)'
    params = (user_id, task_id)
    try:
        result = await conn.execute(sql, *params)
    except asyncpg.RaiseError as e:
        if e.detail == 'NO_SUCH_TASK':
            raise exceptions.NoSuchTask
        if e.detail == 'USER_NOT_MEMBER_OF_TASK_GROUP':
            raise exceptions.UserNotInTaskGroup
        raise

    return None
