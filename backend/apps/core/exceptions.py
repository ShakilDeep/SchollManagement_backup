from rest_framework.exceptions import APIException


class BaseServiceException(APIException):
    status_code = 500
    default_detail = 'A server error occurred.'
    default_code = 'service_error'


class NotFoundException(BaseServiceException):
    status_code = 404
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class ValidationException(BaseServiceException):
    status_code = 400
    default_detail = 'Validation error.'
    default_code = 'validation_error'


class ConflictException(BaseServiceException):
    status_code = 409
    default_detail = 'Resource conflict.'
    default_code = 'conflict'


class UnauthorizedException(BaseServiceException):
    status_code = 401
    default_detail = 'Unauthorized access.'
    default_code = 'unauthorized'


class ForbiddenException(BaseServiceException):
    status_code = 403
    default_detail = 'Forbidden access.'
    default_code = 'forbidden'
