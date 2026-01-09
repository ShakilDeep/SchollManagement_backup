# Authentication & Authorization Module

## Django Authentication System with Django Allauth

### 4.1 Core Authentication Features
- **Multi-method Login**: Email/username and password authentication
- **Social Authentication**: Google, Facebook, and other OAuth providers
- **Role-Based Access Control (RBAC)**: Built on Django's permission system
- **Password Management**: Reset, change, and first-time login flows
- **Session Management**: Secure Django sessions with configurable timeouts
- **Remember Me**: Persistent sessions with security controls
- **Two-Factor Authentication**: Optional TOTP/Email verification
- **Email Verification**: Account verification and confirmation workflows

### 4.2 Django Implementation Architecture

#### 4.2.1 Django Allauth Configuration
```python
# settings/base.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'corsheaders',
    'apps.users',
    'apps.authentication',
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
LOGIN_URL = '/api/auth/login/'
LOGIN_REDIRECT_URL = '/api/auth/user/'
```

#### 4.2.2 Custom User Model Integration
```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=USER_ROLES, default='STUDENT')
    email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_first_login = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
```

### 4.3 API Endpoints (Django REST Framework)

#### 4.3.1 Authentication Endpoints
```
POST   /api/auth/login/                 # User login
POST   /api/auth/logout/                # User logout
POST   /api/auth/refresh/               # JWT token refresh
POST   /api/auth/register/              # User registration
POST   /api/auth/verify-email/          # Email verification
POST   /api/auth/password/reset/        # Password reset request
POST   /api/auth/password/reset/confirm/# Password reset confirmation
POST   /api/auth/password/change/       # Password change (authenticated)
POST   /api/auth/token/refresh/         # Token refresh
```

#### 4.3.2 User Management Endpoints
```
GET    /api/auth/user/                  # Current user profile
PUT    /api/auth/user/                  # Update current user
PATCH  /api/auth/user/                  # Partial update user
POST   /api/auth/user/avatar/           # Upload avatar
DELETE /api/auth/user/avatar/           # Remove avatar
```

#### 4.3.3 Social Authentication Endpoints
```
GET    /api/auth/google/                # Google OAuth URL
GET    /api/auth/facebook/              # Facebook OAuth URL
POST   /api/auth/social/callback/       # Social auth callback
```

### 4.4 Security Implementation

#### 4.4.1 Password Security
- **Django Password Hashing**: PBKDF2 with SHA256 by default
- **Password Policies**: Minimum length, complexity requirements
- **Password History**: Prevent reuse of recent passwords
- **Failed Login Attempts**: Account lockout after multiple attempts

#### 4.4.2 Session & Token Security
- **JWT Tokens**: Access tokens (15 min) + Refresh tokens (7 days)
- **CSRF Protection**: Django's built-in CSRF middleware
- **Secure Headers**: Security middleware with HSTS, X-Frame-Options
- **CORS Configuration**: Configurable allowed origins and methods

#### 4.4.3 API Security
```python
# settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

### 4.5 Custom Authentication Views

#### 4.5.1 Role-Based Login Response
```python
# apps/authentication/views.py
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    # Custom login logic with role-based response
    user = authenticate(request, **credentials)
    if user:
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'role': user.role,
            'permissions': get_user_permissions(user),
            'tokens': get_tokens_for_user(user)
        })
```

### 4.6 Middleware & Permissions

#### 4.6.1 Custom Middleware
```python
# apps/authentication/middleware.py
class RoleBasedAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Add role-based context to request
        if request.user.is_authenticated:
            request.user_role = request.user.role
            request.user_permissions = get_user_permissions(request.user)
        
        response = self.get_response(request)
        return response
```

#### 4.6.2 Custom Permissions
```python
# apps/authentication/permissions.py
from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SUPER_ADMIN'

class IsSchoolAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['SUPER_ADMIN', 'SCHOOL_ADMIN']

class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'TEACHER'
```