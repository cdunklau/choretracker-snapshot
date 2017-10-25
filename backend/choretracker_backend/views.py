from types import CoroutineType
import inspect
import logging
import itertools

import attr
from aiohttp import web

from choretracker_backend import models
from choretracker_backend import db
from choretracker_backend import exceptions

log = logging.getLogger(__name__)

# TODO:
# Investigate CSRF attack potential.
# Can another site provoke the browser to POST/PUT/DELETE to the /apis
# endpoints?
# TODO:
# Investigate security things:
# - CORS assurance (probably in a middleware)
# - Various headers to prevent CSRF, clickjacking, connection downgrade

# TODO:
# Refactor the roundabout view class thing to instead use plain decorators.
# Potential API example:

#    task_resource = RequestHandlerWrapper(path=r'/tasks/{task_id:\d{1,19}}')
#    
#    # These decorators should just return the function unchanged to
#    # facilitate easy testing.
#    @task_resource.handler_for(
#        method='PUT',       # Method explicitly required
#        require_auth=True,  # Default to true anyway
#    )
#    @task_resource.deserialize_with(
#        schema.TaskSchema,  # Factory for marshmallow schema used to deserialize
#                            # request body
#        to='task_to_update',# Destination handler kwarg
#        pass_along=True     # Pass the schema as the 'schema' kwarg
#    )
#    async def task_update(
#            request, *,
#            user_id,        # From request via some auth middleware
#            dbconn,         # Created after deserialization from
#                            # request.app['dbpool'], whole handler wrapped
#                            # `async with dbpool.acquire() as dbconn:`
#            task_id,        # From URL path match_info
#            task_to_update, # From deserialize_with
#            schema,         # From deserialize_with
#            ):
#        async with dbconn.transaction():
#            try:
#                task = await db.user_update_task(
#                    conn,
#                    user_id=user_id,
#                    task_id=task_id,
#                    task_to_update=task_to_update)
#            except exceptions.NoSuchTask:
#                raise web.HTTPNotFound(reason='no such task')
#            except exceptions.UserNotInTaskGroup:
#                raise web.HTTPForbidden(reason='not allowed to access that task')
#            except exceptions.UserNotInRequestedTaskGroup:
#                raise web.HTTPBadRequest(
#                    reason='not allowed to move task to task group {0}'.format(
#                        task_to_update.task_group_id))
#    
#        serialized, _ = self.schema.dump(task)
#        return serialized



def handler_from_view_class(ViewClass):
    """
    Return a tuple of (http_methods, request_handler_coro_func)
    from a view class which has handlers marked via
    `handler_for`.

    The http methods will be those that are supported by the
    view class, for use in the application router's add_route method.

    The request handler coroutine function will instantiate the class
    on each request and return await the handler method.
    """
    request_method_to_names = {}
    members = inspect.getmembers(ViewClass, inspect.iscoroutinefunction)
    for view_method_name, func in members:
        try:
            request_method = func.__choretracker_handler_method__
        except AttributeError:
            continue
        if request_method in request_method_to_names:
            raise TypeError('Multiple handlers found for method {0!r}'.format(
                request_method))
        request_method_to_names[request_method] = view_method_name
    if not request_method_to_names:
        raise TypeError('No handlers found (did you forget `handler_for`?)')
    async def handler(request):
        view = ViewClass(request)
        handler_method_name = request_method_to_names[request.method]
        handler_method = getattr(view, handler_method_name)
        return await handler_method()
    return tuple(request_method_to_names), handler


def handler_for(request_method):
    if request_method not in {'GET', 'POST', 'PUT', 'DELETE'}:
        raise TypeError('Invalid request method {0!r}'.format(request_method))
    def add_meta(view_handler):
        if not inspect.iscoroutinefunction(view_handler):
            raise TypeError(
                'handler {0} is not a coroutine function'.format(view_handler))
        view_handler.__choretracker_handler_method__ = request_method
        return view_handler
    return add_meta


class InputStructureValidationError(exceptions.ChoreTrackerException):
    def __init__(self, error_structure):
        self.error_structure = error_structure


class RequestHasNoJSONContentType(exceptions.ChoreTrackerException):
    pass


class BaseView:
    def __init__(self, request):
        self.request = request
        self.dbpool = request.app['dbpool']
        # FIXME: Fix this when we get auth working
        log.warning('FIXME: Insecurely letting client tell us their user ID')
        try:
            self.user_id = int(request.query['user_id'])
        except (ValueError, KeyError):
            self.user_id = 1

    @classmethod
    def add_handler_at_route(cls, router, path, **add_route_kwargs):
        http_methods, handler = handler_from_view_class(cls)
        for method in http_methods:
            router.add_route(method, path, handler, **add_route_kwargs)

    async def deserialize_request_body(self, schema):
        # TODO: Add a handler for the errors in the middleware
        if self.request.content_type != 'application/json':
            raise RequestHasNoJSONContentType
        raw_structure = await self.request.json()
        app_structure, errors = schema.load(raw_structure)
        if errors:
            # TODO: Figure out how to send these errors nicely
            raise InputStructureValidationError(errors)
        return app_structure


class TasksCollectionView(BaseView):
    def __init__(self, request):
        super().__init__(request)
        self.schema = models.TaskSchema()

    @handler_for('GET')
    async def retrieve_all(self):
        """Send an array of all tasks that the user can view"""
        async with self.dbpool.acquire() as conn:
            tasks = await db.user_fetch_all_tasks(conn, user_id=self.user_id)
        serialized, _ = self.schema.dump(tasks, many=True)
        return serialized

    @handler_for('POST')
    async def create(self):
        """Create a new task"""
        task_to_create = await self.deserialize_request_body(self.schema)

        async with self.dbpool.acquire() as conn, conn.transaction():
            try:
                task = await db.user_create_task(
                    conn, user_id=self.user_id, task_to_create=task_to_create)
            except exceptions.UserNotInRequestedTaskGroup:
                raise web.HTTPBadRequest(
                    reason='not allowed to access task group {0}'.format(
                        task_to_create.task_group_id))

        serialized, _ = self.schema.dump(task)
        return serialized, 201


class TaskResourceView(BaseView):
    def __init__(self, request):
        super().__init__(request)
        self.task_id = int(request.match_info['task_id'])
        self.schema = models.TaskSchema()

    @handler_for('GET')
    async def retrieve(self):
        """Send this task"""
        async with self.dbpool.acquire() as conn:
            try:
                task = await db.user_fetch_task(
                    conn, user_id=self.user_id, task_id=self.task_id)
            except exceptions.NoSuchTask:
                raise web.HTTPNotFound(reason='no such task {0}'.format(self.task_id))
            except exceptions.UserNotInTaskGroup:
                raise web.HTTPForbidden(reason='not allowed to access that task')
        serialized, _ = self.schema.dump(task)
        return serialized

    @handler_for('PUT')
    async def update(self):
        """Update this task"""
        task_to_update = await self.deserialize_request_body(self.schema)
        async with self.dbpool.acquire() as conn, conn.transaction():
            try:
                task = await db.user_update_task(
                    conn,
                    user_id=self.user_id,
                    task_id=self.task_id,
                    task_to_update=task_to_update)
            except exceptions.NoSuchTask:
                raise web.HTTPNotFound(reason='no such task')
            except exceptions.UserNotInTaskGroup:
                raise web.HTTPForbidden(reason='not allowed to access that task')
            except exceptions.UserNotInRequestedTaskGroup:
                raise web.HTTPBadRequest(
                    reason='not allowed to move task to task group {0}'.format(
                        task_to_update.task_group_id))

        serialized, _ = self.schema.dump(task)
        return serialized

    @handler_for('DELETE')
    async def delete(self):
        # delete this task
        async with self.dbpool.acquire() as conn, conn.transaction():
            try:
                await db.user_delete_task(
                    conn, user_id=self.user_id, task_id=self.task_id)
            except exceptions.NoSuchTask:
                raise web.HTTPNotFound(reason='no such task')
            except exceptions.UserNotInTaskGroup:
                raise web.HTTPForbidden(reason='not allowed to access that task')

        return {}


class TaskGroupsCollectionView(BaseView):
    @handler_for('GET')
    async def retrieve_all(self):
        # send an array of all task groups that the user can view
        raise NotImplementedError()

    @handler_for('POST')
    async def create(self):
        # create a new task group
        raise NotImplementedError()


class TaskGroupResourceView(BaseView):
    def __init__(self, request):
        super().__init__(request)
        self.task_group_id = int(request.match_info['task_group_id'])

    @handler_for('GET')
    async def retrieve(self):
        # send this task group
        raise NotImplementedError()

    @handler_for('DELETE')
    async def delete(self):
        # delete this task group and all associated tasks
        raise NotImplementedError()
