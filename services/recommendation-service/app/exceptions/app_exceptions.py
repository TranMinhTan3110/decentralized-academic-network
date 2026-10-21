from fastapi import status

class AppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, data: any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.data = data

class ResourceNotFoundException(AppException):
    def __init__(self, message: str = "Tài nguyên yêu cầu không tồn tại"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND)

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Không có quyền truy cập hoặc phiên đăng nhập không hợp lệ"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)

class ForbiddenException(AppException):
    def __init__(self, message: str = "Bạn không có quyền thực hiện hành động này"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN)

class DuplicateResourceException(AppException):
    def __init__(self, message: str = "Tài nguyên đã tồn tại trong hệ thống"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT)

class ValidationException(AppException):
    def __init__(self, message: str = "Dữ liệu đầu vào không hợp lệ", data: any = None):
        super().__init__(message=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, data=data)
