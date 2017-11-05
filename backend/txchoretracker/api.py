import klein
import zope.interface
from twisted import logger
from twisted.web import resource
from twisted.web import server
import attr

from txchoretracker import models
from txchoretracker import exceptions
from txchoretracker import authentication
from txchoretracker.kleinhelpers import (
    JSONApiRouter, JSONResponseResource
)


log = logger.Logger()


class IApiEndpoint(zope.interface.Interface):
    router = zope.interface.Attribute('''
        The Klein router for this endpoint.
    ''')
    json = zope.interface.Attribute('''
        The :class:`JSONApiRouter` for this endpoint. Needs to be
        given the Klein ``router``.
    ''')
    mountAt = zope.interface.Attribute('''
        The mountpoint for this endpoint. Needs to be a simple string
        (only alphanumeric, possible with hyphens).
    ''')


class ChoreTrackerApi:
    router = klein.Klein()

    def __init__(self, authPolicy, endpoints):
        self.endpointsByMountPoint = {}
        for endpoint in endpoints:
            if endpoint.mountAt in self.endpointsByMountPoint:
                raise TypeError('Duplicated mount point {0}'.format(
                    endpoint.mountAt))
            self.endpointsByMountPoint[endpoint.mountAt] = endpoint
            endpoint.json.injectAuthPolicy(authPolicy)

    @router.route('/<string:endpointName>', branch=True, strict_slashes=False)
    def getEndpointResourceOr404(self, request, endpointName):
        endpoint = self.endpointsByMountPoint.get(endpointName)
        if endpoint is None:
            return JSONResponseResource.makeNotFound()
        return endpoint.router.resource()



def makeApisApp(dbWrapper):
    authPolicy = authentication.CrappyAuthenticationPolicy()
    endpoints = [
        TasksApiEndpoint(dbWrapper)
    ]
    return ChoreTrackerApi(authPolicy, endpoints).router



@zope.interface.implementer(IApiEndpoint)
class UserApiEndpoint:
    """
    User data and authentication.
    """
    router = klein.Klein()
    json = JSONApiRouter(router)
    mountAt = 'user'

    def __init__(self, dbWrapper, authPolicy, googleAppClientId):
        self._db = dbWrapper
        self._authPolicy = authPolicy
        self._googleValidator = authentication.GoogleSignInValidator(
            googleAppClientId)
        self._userProfileSchema = models.UserProfileSchema()

    @json.route('/profile', methods=['GET'])
    async def fetchProfile(self, request):
        try:
            userProfile = await self._db.fetchUserProfile(
                userId=request.authenticatedUserId)
        except exceptions.NoProfileForUser:
            return JSONResponseResource.makeNotFound(
                'no profile for user ID {0}'.format(
                    request.authenticatedUserId))
        except exceptions.NoSuchUser:
            # TODO: Log this, it really shouldn't happen.
            return JSONResponseResource.makeInternalServerError(
                'unknown user ID {0}'.format(request.authenticatedUserId))

        serialized = _dumpWithSchema(self._userProfileSchema, userProfile)
        return JSONResponseResource(serialized)

    @json.route('/profile', methods=['PUT'])
    async def updateProfile(self, request):
        # TODO: Trap exceptions here and return BadRequest
        editedUserProfile = _loadWithSchemaFromRequest(
            self._userProfileSchema, request)
        # TODO:
        # Update the profile from the request
        userProfile = await self._db.createOrUpdateUserProfile(
            userId=request.authenticatedUserId, userProfile=editedUserProfile)

        serialized = _dumpWithSchema(self._userProfileSchema, userProfile)
        return JSONResponseResource(userProfile)

    # TODO: Add a method for verifying user email.

    @json.route('/google-sign-in', methods=['POST'], requiresAuth=False)
    async def authWithGoogleSignIn(self, request):
        # TODO: Trap exceptions here and return a bad request
        idToken = request.getJSONContent()['idToken']

        try:
            validatedGoogleUserId = \
                await self._googleValidator.validateUserIdFromToken(idToken)
        except authentication.InvalidGoogleSignInIdToken:
            return JSONResponseResource.makeBadRequest('invalid ID token')

        userId, userHasProfile = \
            await self._db.googleAuthCreateOrFetchExistingUserId(
                validatedGoogleUserId=validatedGoogleUserId)

        return JSONResponseResource({
            'userId': userId,
            'hasProfile': userHasProfile,
        })


@zope.interface.implementer(IApiEndpoint):
class TaskGroupsApiEndpoint:
    router = klein.Klein()
    json = JSONApiRouter(router)
    mountAt = 'task-groups'

    def __init__(self, dbWrapper):
        self._schema = models.TaskGroupSchema()
        self._db = dbWrapper

    @json.route('/', methods=['GET'])
    async def fetchAll(self, request):
        """
        Send all the task groups that the user can view.
        """
        taskGroups = await self._db.asUserFetchAllTaskGroups(
            userId=request.authenticatedUserId)
        serialized = _dumpWithSchema(self._schema, taskGroups, many=True)
        return JSONResponseResource(serialized)

    @json.route('/', methods=['POST'])
    async def create(self, request):
        """
        Create a new task group.
        """
        # TODO: Trap errors here and return a BadRequestResponse
        taskGroupToCreate = _loadWithSchemaFromRequest(self._schema, request)

        taskGroup = await self._db.asUserCreateTaskGroup(
            userId=request.authenticatedUserId,
            taskGroupToCreate=taskGroupToCreate)

        serialized = _dumpWithSchema(self._schema, taskGroup)
        return JSONResponseResource(serialized, status=201)

    @json.route('/<pgbigserial:taskGroupId>', methods=['GET'])
    async def fetch(self, request, taskGroupId):
        """
        Send this task group.
        """
        try:
            taskGroup = await self._db.asUserFetchTaskGroup(
                userId=request.authenticatedUserId,
                taskGroupId=taskGroupId)
        except exceptions.NoSuchTaskGroup:
            return JSONResponseResource.makeNotFound(
                'Task group with ID {0} does not exist'.format(taskGroupId))
        except exceptions.UserNotInTaskGroup:
            return JSONResponseResource.makeForbidden(
                'Not allowed to access task group with ID {0}'.format(
                    taskGroupId))
        serialized = _dumpWithSchema(self._schema, taskGroup)
        return JSONResponseResource(serialized)

    @json.route('/<pgbigserial:taskGroupId>', methods=['PUT'])
    async def update(self, request, taskGroupId):
        """
        Update this task group.
        """
        taskToUpdate = _loadWithSchemaFromRequest(self._schema, request)
        try:
            task = await self._db.asUserUpdateTaskGroup(
                userId=request.authenticatedUserId,
                taskGroupId=taskGroupId,
                taskGroupToUpdate=taskGroupToUpdate)
        except exceptions.NoSuchTaskGroup:
            return JSONResponseResource.makeNotFound('no such task group')
        except exceptions.UserNotInTaskGroup:
            return JSONResponseResource.makeForbidden(
                'not allowed to access that task group')

        serialized = _dumpWithSchema(self._schema, taskGroup)
        return JSONResponseResource(serialized)

    @json.route('/<pgbigserial:taskGroupId>', methods=['DELETE'])
    async def delete(self, request, taskGroupId):
        """
        Delete this task group.
        """
        try:
            await self._db.asUserDeleteTaskGroup(
                userId=request.authenticatedUserId,
                taskGroupId=taskGroupId)
        except exceptions.NoSuchTaskGroup:
            return JSONResponseResource.makeNotFound('no such task group')
        except exceptions.UserNotInTaskGroup:
            return JSONResponseResource.makeForbidden(
                'not allowed to access that task group')

        return JSONResponseResource({})


@zope.interface.implementer(IApiEndpoint)
class TasksApiEndpoint:
    router = klein.Klein()
    json = JSONApiRouter(router)
    mountAt = 'tasks'

    def __init__(self, dbWrapper):
        self._schema = models.TaskSchema()
        self._db = dbWrapper

    @json.route('/', methods=['GET'])
    async def fetchAll(self, request):
        """
        Send all the tasks that the user can view.
        """
        tasks = await self._db.asUserFetchAllTasks(
            userId=request.authenticatedUserId)
        serialized = _dumpWithSchema(self._schema, tasks, many=True)
        return JSONResponseResource(serialized)


    @json.route('/', methods=['POST'])
    async def create(self, request):
        """
        Create a new task.
        """
        # TODO: Trap errors here and return a BadRequestResponse
        taskToCreate = _loadWithSchemaFromRequest(self._schema, request)

        try:
            task = await self._db.asUserCreateTask(
                userId=request.authenticatedUserId,
                taskToCreate=taskToCreate)
        except exceptions.UserNotInRequestedTaskGroup:
            return JSONResponseResource.makeBadRequest(
                'not allowed to access task group {0}'.format(
                    taskToCreate.task_group_id))

        serialized = _dumpWithSchema(self._schema, task)
        return JSONResponseResource(serialized, status=201)


    @json.route('/<pgbigserial:taskId>', methods=['GET'])
    async def fetch(self, request, taskId):
        """
        Send this task.
        """
        try:
            task = await self._db.asUserFetchTask(
                userId=request.authenticatedUserId,
                taskId=taskId)
        except exceptions.NoSuchTask:
            return JSONResponseResource.makeNotFound(
                'Task with ID {0} does not exist'.format(taskId))
        except exceptions.UserNotInTaskGroup:
            return JSONResponseResource.makeForbidden(
                'Not allowed to access task with ID {0}'.format(taskId))
        serialized = _dumpWithSchema(self._schema, task)
        return JSONResponseResource(serialized)

    @json.route('/<pgbigserial:taskId>', methods=['PUT'])
    async def update(self, request, taskId):
        """
        Update this task.
        """
        taskToUpdate = _loadWithSchemaFromRequest(self._schema, request)
        try:
            task = await self._db.asUserUpdateTask(
                userId=request.authenticatedUserId,
                taskId=taskId,
                taskToUpdate=taskToUpdate)
        except exceptions.NoSuchTask:
            return JSONResponseResource.makeNotFound('no such task')
        except exceptions.UserNotInTaskGroup:
            return JSONResponseResource.makeForbidden(
                'not allowed to access that task')
        except exceptions.UserNotInRequestedTaskGroup:
            return JSONResponseResource.makeBadRequest(
                'not allowed to move task to task group {0}'.format(
                    task_to_update.task_group_id))

        serialized = _dumpWithSchema(self._schema, task)
        return JSONResponseResource(serialized)

    @json.route('/<pgbigserial:taskId>', methods=['DELETE'])
    async def delete(self, request, taskId):
        """
        Delete this task.
        """
        try:
            await self._db.asUserDeleteTask(
                userId=request.authenticatedUserId,
                taskId=taskId)
        except exceptions.NoSuchTask:
            return JSONResponseResource.makeNotFound('no such task')
        except exceptions.UserNotInTaskGroup:
            return JSONResponseResource.makeForbidden(
                'not allowed to access that task')

        return JSONResponseResource({})


def _loadWithSchemaFromRequest(schema, request):
    # TODO: Figure out what exceptions this might raise
    structure = request.getJSONContent()
    task, errors = schema.load(structure)
    if errors:
        raise Exception('Failed to deserialize request body')
    return task


def _dumpWithSchema(schema, model_or_models, many=False):
    # TODO: Raise a better exception if errors is not empty
    structure, errors = schema.dump(model_or_models, many=many)
    if errors:
        raise Exception('failed to serialize {0}: {1}'.format(
            model_or_models, errors))
    return structure
