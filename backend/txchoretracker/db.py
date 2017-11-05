"""
Database pool wrapper to bridge the model object <-> database gap.

Each method just uses a PL/pgSQL function (see ./functions.sql),
and (most) return a model (or list of models) (see ./models.py).

They are all coroutines, so in order to use them in code that expects
Deferreds, wrap the result with
:func:`twisted.internet.defer.ensureDeferred`.
"""
import os.path
from types import MappingProxyType

import psycopg2.extras
from twisted import logger
from twisted.enterprise import adbapi
from twisted.internet import defer

from txchoretracker import models
from txchoretracker import exceptions
from txchoretracker import config
from txchoretracker.utils import coroToDeferred

log = logger.Logger()

_here = os.path.abspath(os.path.dirname(__file__))
_dbFunctionsPath = os.path.join(_here, 'functions.sql')


def setupDBWrapper(postgresDSN):
    """
    Returns a Deferred that fires with a
    :class:`ChoreTrackerDatabase` instance.
    """
    log.info('Creating connection pool')
    dbpool = adbapi.ConnectionPool(
        'psycopg2',
        postgresDSN,
        cursor_factory=psycopg2.extras.DictCursor
    )
    log.info('Installing database functions')
    with open(_dbFunctionsPath, 'r', encoding='utf-8') as fp:
        dbFunctionsSQL = fp.read()
    d = dbpool.runOperation(dbFunctionsSQL)

    @d.addCallback
    def cbSuccess(ignored):
        log.info('Database setup complete')
        return dbpool
    return d.addCallback(ChoreTrackerDatabase)


_DB_RAISE_DETAIL_TO_APP_EXCEPTION = MappingProxyType({
    'NO_SUCH_TASK': exceptions.NoSuchTask,
    'USER_NOT_MEMBER_OF_TASK_GROUP': exceptions.UserNotInTaskGroup,
    'USER_NOT_MEMBER_OF_REQUESTED_TASK_GROUP':
            exceptions.UserNotInRequestedTaskGroup,
    'NO_SUCH_USER': exceptions.NoSuchUser,
    'NO_PROFILE_FOR_USER': exceptions.NoProfileForUser,
})


# When psycopg2 gets an error from a RAISE in a query, it raises
# psycopg2.InternalError. The exception has a `pgcode` attribute, a string
# containing the postgres error code. If the PL/pgSQL RAISE statement
# does not specify the ERRCODE, it will be 'P0001' (raise_exception).
# The exception also has a `diag` attribute (psycopg2.Diagnostics instance),
# the `diag.message_detail` attribute has the string included by the
# DETAIL part of the RAISE statement.
def _wrapAndRaiseDBException(dberr):
    if dberr.pgcode != 'P0001':
        raise dberr
    detail = dberr.diag.message_detail
    appExceptionClass = _DB_RAISE_DETAIL_TO_APP_EXCEPTION.get(detail)
    if appExceptionClass is None:
        raise dberr
    raise appExceptionClass(dberr)


class ChoreTrackerDatabase:
    def __init__(self, dbpool: adbapi.ConnectionPool):
        self.pool = dbpool


    async def asUserFetchAllTasks(self, *, userId):
        sql = 'SELECT * FROM api.asuser_fetch_all_tasks(%s)'
        taskRows = await self.pool.runQuery(sql, [userId])
        return [models.Task(**row) for row in taskRows]


    async def asUserFetchTask(self, *, userId, taskId):
        sql = 'SELECT * FROM api.asuser_fetch_task(%s, %s)'
        params = (userId, taskId)
        try:
            [task_row] = await self.pool.runQuery(sql, params)
        except psycopg2.InternalError as dberr:
            _wrapAndRaiseDBException(dberr)

        return models.Task(**task_row)


    async def asUserCreateTask(self, *, userId, taskToCreate):
        sql = 'SELECT * FROM api.asuser_create_task(%s, %s, %s, %s, %s)'
        params = (
            userId, 
            taskToCreate.task_group_id,
            taskToCreate.name,
            taskToCreate.description,
            taskToCreate.due_unix
        )
        try:
            [newTaskRow] = await self.pool.runQuery(sql, params)
        except psycopg2.InternalError as dberr:
            _wrapAndRaiseDBException(dberr)

        return models.Task(**newTaskRow)


    async def asUserUpdateTask(self, *, userId, taskId, taskToUpdate):
        sql = 'SELECT * FROM api.asuser_update_task(%s, %s, %s, %s, %s, %s)'
        params = (
            userId,
            taskId,
            taskToUpdate.task_group_id,
            taskToUpdate.name,
            taskToUpdate.description,
            taskToUpdate.due_unix
        )
        try:
            [updatedTaskRow] = await self.pool.runQuery(sql, params)
        except psycopg2.InternalError as dberr:
            _wrapAndRaiseDBException(dberr)

        return models.Task(**updatedTaskRow)


    async def asUserDeleteTask(self, *, userId, taskId):
        sql = 'SELECT api.asuser_delete_task(%s, %s)'
        params = (userId, taskId)
        try:
            result = await self.pool.runQuery(sql, params)
        except psycopg2.InternalError as dberr:
            _wrapAndRaiseDBException(dberr)

        return None


    async def fetchUserProfile(self, *, userId):
        sql = 'SELECT * FROM api.fetch_user_profile(%s)'
        params = [userId]
        try:
            [userProfileRow] = await self.pool.runQuery(sql, params)
        except psycopg2.InternalError as dberr:
            _wrapAndRaiseDBException(dberr)

        return models.UserProfile(**userProfileRow)


    async def createOrUpdateUserProfile(self, *, userId, userProfile):
        sql = 'SELECT * FROM api.create_or_update_user_profile(%s, %s, %s)'
        params = (userId, userProfile.email, userProfile.display_name)
        [updatedProfileRow] = await self.pool.runQuery(sql, params)
        return models.UserProfile(**updatedProfileRow)


    async def googleAuthCreateOrFetchExistingUserId(
                self, *, validatedGoogleUserId):
        sql = 'SELECT api.google_auth_fetch_existing_user_id_or_create(%s)'
        params = [validatedGoogleUserId]
        [row] = await self.pool.runQuery(sql, params)
        return row['existing_or_new_user_id'], row['has_profile']
