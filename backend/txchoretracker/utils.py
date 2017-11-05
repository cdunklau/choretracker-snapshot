import functools

from twisted.internet import defer


def coroToDeferred(coroFunc):
    """
    Wrap an `async def`-defined coroutine function such that it
    returns a deferred.
    """
    @functools.wraps(coroFunc)
    def wrapper(*args, **kwargs):
        return defer.ensureDeferred(coroFunc(*args, **kwargs))
    return wrapper

