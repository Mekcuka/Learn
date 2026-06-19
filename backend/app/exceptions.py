from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

DEFAULT_ERROR_MESSAGES: dict[str, str] = {
    "invalid_credentials": "Неверный email или пароль",
    "unauthorized": "Требуется авторизация",
    "forbidden": "Доступ запрещён",
    "validation_error": "Проверьте отправленные данные",
    "internal_error": "Внутренняя ошибка сервера",
}


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")


def _normalize_http_exception(exc: HTTPException) -> tuple[str, str]:
    detail = exc.detail
    if isinstance(detail, dict):
        code = str(detail.get("detail") or detail.get("code") or "error")
        message = str(detail.get("message") or DEFAULT_ERROR_MESSAGES.get(code, "Не удалось выполнить запрос"))
        return code, message
    if isinstance(detail, str):
        return detail, DEFAULT_ERROR_MESSAGES.get(detail, detail)
    return "error", str(detail)


def api_error_response(
    request: Request,
    *,
    status_code: int,
    code: str,
    message: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": code,
            "message": message,
            "request_id": _request_id(request),
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    code, message = _normalize_http_exception(exc)
    return api_error_response(request, status_code=exc.status_code, code=code, message=message)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    _ = exc
    return api_error_response(
        request,
        status_code=422,
        code="validation_error",
        message=DEFAULT_ERROR_MESSAGES["validation_error"],
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    _ = exc
    return api_error_response(
        request,
        status_code=500,
        code="internal_error",
        message=DEFAULT_ERROR_MESSAGES["internal_error"],
    )
