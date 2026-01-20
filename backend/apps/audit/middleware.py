import json
import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()
logger = logging.getLogger('apps.audit')


class AuditLogMiddleware(MiddlewareMixin):
    skip_paths = ['/silk/', '/admin/jsi18n/', '/static/', '/media/']
    
    def process_request(self, request):
        request.audit_data = {
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
        return None

    def process_response(self, request, response):
        if self.should_skip_audit(request):
            return response
        
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response
        
        try:
            action = self.determine_action(request)
            if action and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                self.create_audit_log(request, action, response)
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
        
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def should_skip_audit(self, request):
        path = request.path
        return any(skip in path for skip in self.skip_paths)

    def determine_action(self, request):
        method = request.method
        if method == 'GET':
            return 'view'
        elif method == 'POST':
            return 'create'
        elif method in ['PUT', 'PATCH']:
            return 'update'
        elif method == 'DELETE':
            return 'delete'
        return None

    def create_audit_log(self, request, action, response):
        try:
            body = getattr(request, 'body', b'')
            changes = {}
            if body:
                try:
                    changes = json.loads(body.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    pass
            
            AuditLog.objects.create(
                user=request.user,
                action=action,
                model_name=self.get_model_name(request),
                object_id=self.get_object_id(request),
                changes=changes,
                ip_address=request.audit_data.get('ip_address'),
                user_agent=request.audit_data.get('user_agent'),
                metadata={
                    'path': request.path,
                    'method': request.method,
                    'status_code': response.status_code,
                }
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")

    def get_model_name(self, request):
        path_parts = request.path.strip('/').split('/')
        if len(path_parts) >= 2:
            return path_parts[1]
        return 'unknown'

    def get_object_id(self, request):
        path_parts = request.path.strip('/').split('/')
        if len(path_parts) >= 3:
            return path_parts[2]
        return None
