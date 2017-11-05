class ChoreTrackerException(Exception):
    pass


class UserNotInTaskGroup(ChoreTrackerException):
    pass

class UserNotInRequestedTaskGroup(ChoreTrackerException):
    pass

class NoSuchTask(ChoreTrackerException):
    pass

class NoSuchUser(ChoreTrackerException):
    pass

class NoProfileForUser(ChoreTrackerException):
    pass
