from twisted import logger
from twisted.web import server
from twisted.web import resource
from twisted.application import service
from twisted.internet import endpoints
from twisted.internet import reactor

from txchoretracker import api
from txchoretracker import db
from txchoretracker import config



class ChoreTrackerAPIService(service.Service):
    log = logger.Logger()

    def __init__(
                self,
                restApiConfig: config.RestApiConfig,
                dbConfig: config.DatabaseConfig,
            ):
        super().__init__()
        self._dbWrapper = None
        self._listeningPort = None
        self.dbConfig = dbConfig
        self.restApiConfig = restApiConfig

    def startService(self):
        dfd = db.setupDBWrapper(self.dbConfig.get_dsn())

        @dfd.addCallback
        def cbSetDBWrapper(dbWrapper):
            self._dbWrapper = dbWrapper
            return dbWrapper

        dfd.addCallback(self._createSite)
        dfd.addCallback(self._startListening)

        @dfd.addCallback
        def cbSetLastBits(listeningPort):
            self.running = True
            self._listeningPort = listeningPort

        @dfd.addErrback
        def ebCancelStart(failure):
            self.log.failure(
                'Failed to start ChoreTrackerAPIService',
                failure=failure
            )
            return self.stopService()

    def stopService(self):
        self.running = False
        if self._listeningPort is not None:
            self.log.info('Stopping listening port')
            # TODO: Figure out what to do with the possible deferred here
            self._listeningPort.stopListening()
        if self._dbWrapper is not None:
            self.log.info('Closing database pool')
            self._dbWrapper.pool.close()
            self._dbWrapper = None


    def _createSite(self, dbWrapper):
        # TODO: Add more stuff here. Session stuff, auth framework stuff, etc.
        apiApp = api.makeApisApp(dbWrapper)
        if self.restApiConfig.development:
            rootResource = resource.Resource()
            rootResource.putChild(b'apis', apiApp.resource())
        else:
            rootResource = apiApp.resource()
        site = server.Site(rootResource)
        return site

    def _startListening(self, site):
        self._endpoint = endpoints.TCP4ServerEndpoint(reactor, 8080)
        return self._endpoint.listen(site)
