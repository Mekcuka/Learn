from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

_STATIC_CACHE = "public, max-age=86400, immutable"


class StaticCacheControlMiddleware(BaseHTTPMiddleware):
    """Cache-Control for `/content/*` when backend serves static assets."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        if request.url.path.startswith("/content/"):
            response.headers.setdefault("Cache-Control", _STATIC_CACHE)
        return response
