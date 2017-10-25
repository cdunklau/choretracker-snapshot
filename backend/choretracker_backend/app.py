import os.path
import asyncio
import typing
import logging
import re

from aiohttp import web

from choretracker_backend import middleware
from choretracker_backend import views
from choretracker_backend import db
from choretracker_backend.config import ApplicationConfig


log = logging.getLogger(__name__)


async def build_app(
            *,
            config: ApplicationConfig,
            loop: asyncio.AbstractEventLoop
        ) -> typing.Awaitable[web.Application]:

    mws = [
        middleware.json_middleware_factory,
    ]
    api = web.Application(loop=loop, middlewares=mws)

    api['dbpool'] = await db.setup_dbpool(config.db)

    views.TasksCollectionView.add_handler_at_route(
        api.router, '/tasks')
    views.TaskResourceView.add_handler_at_route(
        api.router, r'/tasks/{task_id:\d{1,19}}')

    if config.general.development:
        # Link straight to the built files
        # This also works with the create-react-app proxy
        log.info('Starting in development mode')
        devapp = web.Application(loop=loop)
        here = os.path.abspath(os.path.dirname(__file__))
        built_frontend_path = os.path.normpath(os.path.join(
            here, os.pardir, os.pardir, 'frontend', 'build'
        ))
        static_files = os.listdir(built_frontend_path)
        template_index = os.path.join(built_frontend_path, 'index.html')
        with open(template_index, 'rb') as fp:
            index_template_bytes = fp.read()

        devapp.add_subapp('/apis/', api)
        devapp.router.add_route(
            'GET',
            r'/{{whatever:(?!apis.*|{filepatterns}).*}}'.format(
                filepatterns='|'.join(re.escape(fn) + '.*' for fn in static_files)),
            _make_development_html_handler(index_template_bytes)
        )
        devapp.router.add_static('/', built_frontend_path)
        return devapp

    return api


def _make_development_html_handler(index_template_bytes):
    def _development_html_handler(request):
        return web.Response(
            body=index_template_bytes,
            content_type='text/html',
            charset='utf-8',
        )
    return _development_html_handler
