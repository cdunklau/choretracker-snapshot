import typing

from aiohttp import web

JSONSerializable = typing.Union[
    None, bool,
    str, int, float,
    typing.Dict[str, 'JSONSerializable'],
    typing.List['JSONSerializable'],
]

JSONSerializableContainer = typing.Union[
    typing.Dict[str, JSONSerializable],
    typing.List[JSONSerializable],
]

JSONRequestHandlerResult = typing.Union[
    JSONSerializableContainer,
    typing.Tuple[
        typing.Optional[JSONSerializableContainer],
        typing.Optional[int],  # response status code
    ]
]

JSONRequestHandler = typing.Callable[
    [web.Request],
    typing.Awaitable[JSONRequestHandlerResult]
]

