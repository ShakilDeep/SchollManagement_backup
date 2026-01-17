# Migrating EduCore to Django Backend - Complete Step-by-Step Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Django Project Setup](#phase-1-django-project-setup)
4. [Phase 2: Database Configuration](#phase-2-database-configuration)
5. [Phase 3: Creating Django Apps](#phase-3-creating-django-apps)
6. [Phase 4: Converting Models](#phase-4-converting-models)
7. [Phase 5: Django REST Framework Setup](#phase-5-django-rest-framework-setup)
8. [Phase 6: Creating API Endpoints](#phase-6-creating-api-endpoints)
9. [Phase 7: Authentication](#phase-7-authentication)
10. [Phase 8: Frontend Integration](#phase-8-frontend-integration)
11. [Phase 9: AI Services Integration](#phase-9-ai-services-integration)
12. [Phase 10: Testing](#phase-10-testing)
13. [Phase 11: Deployment](#phase-11-deployment)

---

## Overview

### Current Architecture
```
Next.js (Frontend + API Routes) → Prisma ORM → SQLite Database
```

### Target Architecture
```
Next.js (Frontend Only) → Django REST Framework (API) → Django ORM → PostgreSQL/MySQL
```

### Benefits
- Separation of concerns (frontend/backend decoupled)
- Django Admin Panel (built-in)
- Better Python ecosystem for AI/ML services
- Scalable architecture
- Independent frontend/backend deployment

---

## Prerequisites

### Required Software
- Python 3.11+ installed
- pip (Python package manager)
- PostgreSQL 15+ or MySQL 8+ (recommended) OR SQLite (development)
- Node.js (existing, for Next.js frontend)
- Git

### Python Dependencies
```bash
pip install django djangorestframework django-cors-headers django-filter
pip install django-allauth dj-rest-auth
pip install python-decouple psycopg2-binary  # For PostgreSQL
pip install drf-spectacular  # API documentation
```

---

## Phase 1: Django Project Setup

### Step 1.1: Create Backend Directory
```bash
cd "f:\Scholl Management"
mkdir backend
cd backend
```

### Step 1.2: Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

### Step 1.3: Install Dependencies
```bash
pip install django==5.0.1
pip install djangorestframework==3.14.0
pip install django-cors-headers==4.3.1
pip install django-filter==23.5
pip install python-decouple==3.8
pip install drf-spectacular==0.27.1
pip install django-allauth==0.60.1
pip install dj-rest-auth==6.0.0
pip install pillow==10.2.0
```

### Step 1.4: Create Django Project
```bash
django-admin startproject config .
```

### Step 1.5: Project Structure
```
backend/
├── manage.py
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── venv/
└── requirements.txt
```

### Step 1.6: Create Requirements File
```bash
pip freeze > requirements.txt
```

---

## Phase 2: Database Configuration

### Step 2.1: Create .env File
Create `backend/.env`:
```env
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL (production)
# DATABASE_URL=postgresql://user:password@localhost:5432/educore

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Step 2.2: Update settings.py
```python
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    
    # Local apps (will be created in Phase 3)
    'apps.users',
    'apps.students',
    'apps.attendance',
    'apps.staff',
    'apps.exams',
    'apps.curriculum',
    'apps.library',
    'apps.inventory',
    'apps.transport',
    'apps.hostel',
    'apps.messages',
    'apps.behavior',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# For PostgreSQL (production):
# import dj_database_url
# DATABASES = {
#     'default': dj_database_url.parse(config('DATABASE_URL'))
# }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'EduCore API',
    'DESCRIPTION': 'School Management System API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Allauth Configuration
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]
```

### Step 2.3: Create URLs Configuration
Update `config/urls.py`:
```python
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.students.urls')),
    path('api/', include('apps.attendance.urls')),
    path('api/', include('apps.staff.urls')),
    path('api/', include('apps.exams.urls')),
    path('api/', include('apps.curriculum.urls')),
    path('api/', include('apps.library.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/', include('apps.transport.urls')),
    path('api/', include('apps.hostel.urls')),
    path('api/', include('apps.messages.urls')),
    path('api/', include('apps.behavior.urls')),
]
```

---

## Phase 3: Creating Django Apps

### Step 3.1: Create Apps Directory and Apps
```bash
cd backend
mkdir apps
cd apps

python ../manage.py startapp users
python ../manage.py startapp students
python ../manage.py startapp attendance
python ../manage.py startapp staff
python ../manage.py startapp exams
python ../manage.py startapp curriculum
python ../manage.py startapp library
python ../manage.py startapp inventory
python ../manage.py startapp transport
python ../manage.py startapp hostel
python ../manage.py startapp messages
python ../manage.py startapp behavior
```

### Step 3.2: Create __init__.py in Apps Directory
```bash
cd apps
type nul > __init__.py
```

### Step 3.3: App Structure Template
Each app will have this structure:
```
apps/
├── users/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── filters.py
│   └── permissions.py
```

---

## Phase 4: Converting Models

### Step 4.1: Custom User Model
Create `apps/users/models.py`:
```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    ADMIN = 'ADMIN', 'Admin'
    TEACHER = 'TEACHER', 'Teacher'
    STUDENT = 'STUDENT', 'Student'
    PARENT = 'PARENT', 'Parent'
    STAFF = 'STAFF', 'Staff'
    LIBRARIAN = 'LIBRARIAN', 'Librarian'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT
    )
    avatar = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(auto_now=True)
    force_password_change = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
```

### Step 4.2: Student Model
Create `apps/students/models.py`:
```python
from django.db import models
from apps.users.models import User

class AcademicYear(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['is_current']),
        ]

    def __str__(self):
        return self.name

class Grade(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=50)
    numeric_value = models.IntegerField()
    order = models.IntegerField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Section(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=50)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=20, blank=True, null=True)
    capacity = models.IntegerField(default=40)
    current_strength = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.grade.name} - {self.name}"

class Parent(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Student(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    roll_number = models.CharField(max_length=20, unique=True)
    admission_number = models.CharField(max_length=20, unique=True)
    admission_date = models.DateField(auto_now_add=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10)
    date_of_birth = models.DateField()
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    religion = models.CharField(max_length=50, blank=True, null=True)
    nationality = models.CharField(max_length=50, default='Local')
    mother_tongue = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100)
    emergency_phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    guardian = models.ForeignKey(Parent, on_delete=models.CASCADE)
    relationship = models.CharField(max_length=50)
    house = models.CharField(max_length=50, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    special_needs = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    photo = models.ImageField(upload_to='students/photos/', blank=True, null=True)
    documents = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['roll_number']),
            models.Index(fields=['grade']),
            models.Index(fields=['academic_year']),
            models.Index(fields=['section']),
            models.Index(fields=['status']),
            models.Index(fields=['first_name', 'last_name']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.roll_number})"
```

### Step 4.3: Attendance Model
Create `apps/attendance/models.py`:
```python
from django.db import models
from apps.users.models import User
from apps.students.models import Student

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    ]

    id = models.CharField(max_length=255, primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    check_in_time = models.TimeField(blank=True, null=True)
    check_out_time = models.TimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    marked_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['student', 'date']]
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['student']),
            models.Index(fields=['date', 'status']),
        ]

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"
```

### Step 4.4: Staff Model
Create `apps/staff/models.py`:
```python
from django.db import models
from apps.users.models import User

class Staff(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10)
    date_of_birth = models.DateField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    qualification = models.CharField(max_length=200, blank=True, null=True)
    join_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['employee_id']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
```

### Step 4.5: Continue with Other Models
Follow similar patterns for:
- `apps/exams/models.py` (Exam, ExamPaper, ExamResult)
- `apps/curriculum/models.py` (Curriculum, Lesson, Course, CourseModule)
- `apps/library/models.py` (Book, LibraryBorrowal)
- `apps/inventory/models.py` (Asset, InventoryTransaction)
- `apps/transport/models.py` (Vehicle, TransportAllocation)
- `apps/hostel/models.py` (Hostel, Room, HostelAllocation)
- `apps/messages/models.py` (Message, Notification)
- `apps/behavior/models.py` (BehaviorRecord)

### Step 4.6: Run Initial Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Step 4.7: Create Superuser
```bash
python manage.py createsuperuser
```

---

## Phase 5: Django REST Framework Setup

### Step 5.1: Create Base Serializer
Create `apps/users/serializers.py`:
```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserRole

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'full_name', 'avatar', 'phone',
            'address', 'date_of_birth', 'is_active', 'last_login',
            'force_password_change', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'role', 'phone', 'address'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
```

### Step 5.2: Create Base ViewSet
Create `apps/users/views.py`:
```python
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserCreateSerializer
from .permissions import IsSuperAdmin

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('student', 'staff', 'teacher', 'parent')
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsSuperAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'students': User.objects.filter(role='STUDENT').count(),
            'teachers': User.objects.filter(role='TEACHER').count(),
            'staff': User.objects.filter(role='STAFF').count(),
        }
        return Response(stats)
```

### Step 5.3: Create URLs
Create `apps/users/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]
```

### Step 5.4: Create Permissions
Create `apps/users/permissions.py`:
```python
from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'SUPER_ADMIN'

class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['SUPER_ADMIN', 'ADMIN']

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'TEACHER'
```

---

## Phase 6: Creating API Endpoints

### Step 6.1: Student ViewSet
Create `apps/students/views.py`:
```python
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from .models import Student, AcademicYear, Grade, Section, Parent
from .serializers import StudentSerializer, StudentCreateSerializer, StudentUpdateSerializer
from .filters import StudentFilter

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related(
        'user', 'grade', 'section', 'academic_year', 'guardian'
    ).prefetch_related('attendances', 'exam_results').all()
    serializer_class = StudentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StudentFilter
    search_fields = ['first_name', 'last_name', 'roll_number', 'admission_number']
    ordering_fields = ['first_name', 'last_name', 'admission_date']
    ordering = ['-admission_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StudentUpdateSerializer
        return StudentSerializer

    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats = {
            'total_students': Student.objects.count(),
            'active_students': Student.objects.filter(status='Active').count(),
            'by_grade': list(
                Student.objects.values('grade__name')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'by_section': list(
                Student.objects.values('grade__name', 'section__name')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
        }
        return Response(stats)

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        student = self.get_object()
        from apps.attendance.models import Attendance
        attendances = Attendance.objects.filter(student=student).order_by('-date')
        from apps.attendance.serializers import AttendanceSerializer
        serializer = AttendanceSerializer(attendances, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        student = self.get_object()
        from apps.exams.models import ExamResult
        results = ExamResult.objects.filter(student=student).select_related('exam_paper')
        from apps.exams.serializers import ExamResultSerializer
        serializer = ExamResultSerializer(results, many=True)
        return Response(serializer.data)
```

### Step 6.2: Student Serializer
Create `apps/students/serializers.py`:
```python
from rest_framework import serializers
from .models import Student, AcademicYear, Grade, Section, Parent
from apps.users.serializers import UserSerializer

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'

class SectionSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)

    class Meta:
        model = Section
        fields = '__all__'

class ParentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Parent
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    guardian_name = serializers.CharField(source='guardian.first_name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class StudentCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Student
        fields = [
            'username', 'email', 'password',
            'roll_number', 'admission_number',
            'first_name', 'last_name', 'gender',
            'date_of_birth', 'phone', 'email',
            'emergency_contact', 'emergency_phone',
            'address', 'city', 'state', 'zip_code',
            'grade', 'section', 'academic_year',
            'guardian', 'relationship'
        ]

    def create(self, validated_data):
        from apps.users.models import User, UserRole
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=UserRole.STUDENT,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        validated_data['user'] = user
        return super().create(validated_data)
```

### Step 6.3: Student Filters
Create `apps/students/filters.py`:
```python
import django_filters
from .models import Student

class StudentFilter(django_filters.FilterSet):
    grade = django_filters.CharFilter(field_name='grade__name', lookup_expr='iexact')
    section = django_filters.CharFilter(field_name='section__name', lookup_expr='iexact')
    academic_year = django_filters.CharFilter(field_name='academic_year__name', lookup_expr='iexact')
    status = django_filters.CharFilter(lookup_expr='iexact')
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Student
        fields = ['grade', 'section', 'academic_year', 'status']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(roll_number__icontains=value) |
            Q(admission_number__icontains=value)
        )
```

### Step 6.4: Student URLs
Create `apps/students/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet
from .views import AcademicYearViewSet, GradeViewSet, SectionViewSet, ParentViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'parents', ParentViewSet, basename='parent')

urlpatterns = [
    path('', include(router.urls)),
]
```

### Step 6.5: Repeat for Other Modules
Follow the same pattern for:
- `apps/attendance/` (AttendanceViewSet)
- `apps/staff/` (StaffViewSet)
- `apps/exams/` (ExamViewSet, ExamPaperViewSet, ExamResultViewSet)
- `apps/curriculum/` (CurriculumViewSet, LessonViewSet)
- `apps/library/` (BookViewSet, LibraryBorrowalViewSet)
- `apps/inventory/` (AssetViewSet, InventoryTransactionViewSet)
- `apps/transport/` (VehicleViewSet, TransportAllocationViewSet)
- `apps/hostel/` (HostelViewSet, RoomViewSet, HostelAllocationViewSet)
- `apps/messages/` (MessageViewSet)
- `apps/behavior/` (BehaviorRecordViewSet)

---

## Phase 7: Authentication

### Step 7.1: Setup dj-rest-auth
Add to `config/settings.py`:
```python
REST_AUTH = {
    'SESSION_LOGIN': True,
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'access_token',
    'JWT_AUTH_REFRESH_COOKIE': 'refresh_token',
    'JWT_AUTH_HTTPONLY': False,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication',
    ],
}
```

### Step 7.2: Create Authentication Views
Create `apps/users/views.py` (add to existing):
```python
from dj_rest_auth.views import LoginView, LogoutView
from dj_rest_auth.registration.views import RegisterView
from rest_framework.response import Response

class CustomLoginView(LoginView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = self.user
            user_data = UserSerializer(user).data
            response.data['user'] = user_data
        return response
```

### Step 7.3: Update URLs
```python
urlpatterns = [
    path('api/auth/login/', CustomLoginView.as_view(), name='rest_login'),
    path('api/auth/logout/', LogoutView.as_view(), name='rest_logout'),
    path('api/auth/register/', RegisterView.as_view(), name='rest_register'),
]
```

---

## Phase 8: Frontend Integration

### Step 8.1: Create API Client
Create `frontend/src/lib/api/client.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### Step 8.2: Create API Hooks
Create `frontend/src/lib/api/hooks.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

// Students
export function useStudents(params?: any) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => apiClient.get('/students/', params),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => apiClient.get(`/students/${id}/`),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/students/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => apiClient.patch(`/students/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/students/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Authentication
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: any) => apiClient.post('/auth/login/', credentials),
    onSuccess: (data: any) => {
      apiClient.setToken(data.access_token);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout/', {}),
    onSuccess: () => {
      apiClient.clearToken();
    },
  });
}

// Similar hooks for other resources...
```

### Step 8.3: Update Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Step 8.4: Update Component to Use Django API
Example - Update `frontend/src/app/dashboard/students/page.tsx`:

**Before** (Prisma API):
```typescript
const response = await fetch('/api/students')
```

**After** (Django API):
```typescript
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/lib/api/hooks';

function StudentsPage() {
  const { data: students, isLoading } = useStudents();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  // Use students data...
}
```

### Step 8.5: Remove Next.js API Routes
Delete or disable all files in `frontend/src/app/api/` since Django now handles all API requests.

---

## Phase 9: AI Services Integration

### Step 9.1: Create AI Service Directory
```bash
cd backend
mkdir ai_services
cd ai_services
type nul > __init__.py
```

### Step 9.2: Install AI Dependencies
```bash
pip install google-generative-ai openai
```

### Step 9.3: Create AI Client
Create `backend/ai_services/gemini_client.py`:
```python
import google.generativeai as genai
from django.conf import settings

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')

    async def generate_response(self, prompt: str) -> str:
        response = await self.model.generate_content_async(prompt)
        return response.text

gemini_client = GeminiClient()
```

### Step 9.4: Create AI Prediction Views
Create `apps/students/views.py` (add to existing):
```python
from rest_framework.decorators import action
from rest_framework.response import Response
from ai_services.gemini_client import gemini_client

class StudentViewSet(viewsets.ModelViewSet):
    # ... existing code ...

    @action(detail=False, methods=['post'])
    async def predict_performance(self, request):
        students = self.get_queryset()
        prompt = f"""
        Analyze the following student data and predict performance trends:
        {students.values('first_name', 'last_name', 'grade', 'attendance_count', 'average_marks')}
        
        Provide predictions for:
        1. At-risk students (high probability of underperformance)
        2. Top performers
        3. Students needing intervention
        """
        prediction = await gemini_client.generate_response(prompt)
        return Response({'prediction': prediction})
```

### Step 9.5: Create AI Endpoints for Each Module
- Attendance predictions
- Exam performance predictions
- Library recommendations
- Staff effectiveness analysis
- Inventory predictions
- Hostel occupancy predictions

---

## Phase 10: Testing

### Step 10.1: Write Unit Tests
Create `apps/students/tests.py`:
```python
from django.test import TestCase
from rest_framework.test import APITestCase
from .models import Student
from .serializers import StudentSerializer

class StudentModelTest(TestCase):
    def setUp(self):
        self.student = Student.objects.create(
            roll_number='STU001',
            admission_number='ADM001',
            first_name='John',
            last_name='Doe',
            # ... other fields
        )

    def test_student_creation(self):
        self.assertEqual(self.student.first_name, 'John')
        self.assertEqual(self.student.roll_number, 'STU001')

class StudentAPITest(APITestCase):
    def setUp(self):
        # Create test user and authenticate
        pass

    def test_list_students(self):
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, 200)

    def test_create_student(self):
        data = {
            'roll_number': 'STU002',
            'first_name': 'Jane',
            # ... other fields
        }
        response = self.client.post('/api/students/', data)
        self.assertEqual(response.status_code, 201)
```

### Step 10.2: Run Tests
```bash
cd backend
python manage.py test
```

### Step 10.3: Test API Documentation
Visit: `http://localhost:8000/api/docs/`

---

## Phase 11: Deployment

### Step 11.1: Backend Deployment (Django)

**Using Gunicorn + Nginx:**

```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

**Docker Setup:**

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

Create `backend/docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: educore
      POSTGRES_USER: educore
      POSTGRES_PASSWORD: yourpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgres://educore:yourpassword@db:5432/educore

volumes:
  postgres_data:
```

### Step 11.2: Frontend Deployment (Next.js)

**Build for Production:**
```bash
cd frontend
npm run build
npm start
```

**Docker Setup:**

Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 11.3: Production Settings

Update `backend/config/settings.py`:
```python
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'api.yourdomain.com']

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Database (PostgreSQL)
import dj_database_url
DATABASES = {
    'default': dj_database_url.parse(os.environ['DATABASE_URL'])
}
```

---

## Summary Checklist

### Phase 1: Django Setup
- [ ] Create backend directory
- [ ] Set up virtual environment
- [ ] Install dependencies
- [ ] Create Django project
- [ ] Configure settings.py
- [ ] Set up database
- [ ] Run initial migrations

### Phase 2: Create Apps
- [ ] Create users app
- [ ] Create students app
- [ ] Create attendance app
- [ ] Create staff app
- [ ] Create exams app
- [ ] Create curriculum app
- [ ] Create library app
- [ ] Create inventory app
- [ ] Create transport app
- [ ] Create hostel app
- [ ] Create messages app
- [ ] Create behavior app

### Phase 3: Models
- [ ] Create User model
- [ ] Create Student model
- [ ] Create Attendance model
- [ ] Create Staff model
- [ ] Create Exam models
- [ ] Create Curriculum models
- [ ] Create Library models
- [ ] Create Inventory models
- [ ] Create Transport models
- [ ] Create Hostel models
- [ ] Create Message models
- [ ] Create Behavior models

### Phase 4: Serializers
- [ ] Create User serializer
- [ ] Create Student serializer
- [ ] Create Attendance serializer
- [ ] Create all other serializers

### Phase 5: Views & URLs
- [ ] Create ViewSets for all models
- [ ] Create URLs for all apps
- [ ] Set up main URL configuration

### Phase 6: Authentication
- [ ] Configure dj-rest-auth
- [ ] Set up JWT authentication
- [ ] Create custom login/logout views

### Phase 7: Frontend Integration
- [ ] Create API client
- [ ] Create API hooks
- [ ] Update components to use Django API
- [ ] Remove Next.js API routes

### Phase 8: AI Services
- [ ] Set up AI client
- [ ] Create prediction endpoints
- [ ] Integrate with frontend

### Phase 9: Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test API documentation

### Phase 10: Deployment
- [ ] Set up production database
- [ ] Configure production settings
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Set up CI/CD

---

## Quick Reference

### API Endpoints Structure
```
/api/
├── auth/
│   ├── login/
│   ├── logout/
│   └── register/
├── users/
│   ├── /
│   ├── me/
│   └── stats/
├── students/
│   ├── /
│   ├── :id/
│   ├── stats/
│   ├── attendance/
│   └── results/
├── attendance/
│   └── /
├── staff/
│   └── /
├── exams/
│   ├── /
│   ├── :id/
│   └── predictions/
├── curriculum/
│   ├── /
│   ├── :id/
│   └── lessons/
├── library/
│   ├── books/
│   ├── borrowals/
│   └── recommendations/
├── inventory/
│   ├── assets/
│   └── predictions/
├── transport/
│   ├── vehicles/
│   └── allocations/
├── hostel/
│   ├── /
│   ├── rooms/
│   └── allocations/
├── messages/
│   └── /
└── behavior/
    └── /
```

### Common Commands

**Django:**
```bash
python manage.py runserver              # Start dev server
python manage.py makemigrations         # Create migrations
python manage.py migrate               # Apply migrations
python manage.py createsuperuser        # Create admin user
python manage.py collectstatic          # Collect static files
python manage.py test                   # Run tests
python manage.py shell                 # Django shell
```

**Next.js:**
```bash
npm run dev                           # Start dev server
npm run build                         # Build for production
npm start                             # Start production server
npm run lint                          # Run linter
```

---

## Troubleshooting

### Common Issues

**CORS Error:**
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check middleware order in settings.py

**Authentication Error:**
- Verify JWT configuration
- Check token is being sent in Authorization header
- Ensure token is not expired

**Database Connection Error:**
- Check DATABASE_URL in .env
- Verify PostgreSQL/MySQL service is running
- Check database credentials

**Import Error:**
- Ensure all apps are added to INSTALLED_APPS
- Check PYTHONPATH includes project root
- Verify virtual environment is activated

---

## Next Steps

1. Start with Phase 1-3 (Setup and Models)
2. Test each app individually
3. Gradually migrate frontend to use Django APIs
4. Set up authentication
5. Deploy to staging environment
6. Migrate production data
7. Deploy to production

---

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [dj-rest-auth](https://dj-rest-auth.readthedocs.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)

---

**Last Updated:** 2025-01-17
**Version:** 1.0.0
