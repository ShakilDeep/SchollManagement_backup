from rest_framework import permissions

class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'SUPER_ADMIN']

class IsPrincipalOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN']

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['TEACHER', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN']

class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['STAFF', 'TEACHER', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN']

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user or request.user.role in ['ADMIN', 'SUPER_ADMIN']
