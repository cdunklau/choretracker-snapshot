import os

from twisted.application import service

from txchoretracker.config import processConfigFile
from txchoretracker.services import ChoreTrackerAPIService

configFile = os.environ.get('CHORETRACKER_CONFIG', 'choretracker.ini')
here = os.path.abspath(os.path.dirname(__file__))
configFilePath = os.path.join(here, configFile)
config = processConfigFile(configFilePath)

application = service.Application('ChoreTracker')
ChoreTrackerAPIService(config.restapi, config.db).setServiceParent(application)
