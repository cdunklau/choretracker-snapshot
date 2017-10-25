class ChoreTrackerException(Exception):
    pass


class UserNotInTaskGroup(ChoreTrackerException):
    pass

class UserNotInRequestedTaskGroup(ChoreTrackerException):
    pass

class NoSuchTask(ChoreTrackerException):
    pass
