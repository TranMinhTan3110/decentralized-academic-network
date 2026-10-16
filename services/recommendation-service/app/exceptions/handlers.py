from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.exceptions.app_exceptions import AppException
from app.schemas.common import ApiResponse

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiResponse.err(message=exc.message, data=exc.data).model_dump(mode="json")
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        first_error = exc.errors()[0] if exc.errors() else {"msg": "Dữ liệu không hợp lệ"}
        error_msg = f"{first_error.get('loc', ['field'])[-1]}: {first_error.get('msg')}"
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse.err(
                message=f"Dữ liệu đầu vào không hợp lệ: {error_msg}",
                data=exc.errors()
            ).model_dump(mode="json")
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail_msg = exc.detail if isinstance(exc.detail, str) else "Lỗi yêu cầu HTTP"
        return JSONResponse(
            status_code=exc.status_code,
            content=ApiResponse.err(message=detail_msg).model_dump(mode="json")
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse.err(message="Lỗi máy chủ nội bộ. Vui lòng thử lại sau.").model_dump(mode="json")
        )
