# User Management Module

## Django User Management System

### 4.1 Architecture Overview
- **Base User Model**: Custom Django User with role-based access
- **Profile Models**: Extended profiles for each user type
- **Django Admin**: Built-in admin interface for management
- **REST API**: Django REST Framework for frontend integration
- **File Management**: Django file handling for documents and images
- **Bulk Operations**: CSV import/export with Django management commands

### 4.2 Student Management

#### 4.2.1 Django Models
```python
# apps/students/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
import uuid

User = get_user_model()

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    admission_number = models.CharField(max_length=20, unique=True)
    admission_date = models.DateField()
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    blood_group = models.CharField(max_length=5, blank=True)
    address = models.JSONField()
    emergency_contact = models.JSONField()
    medical_information = models.TextField(blank=True)
    previous_school = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class StudentDocument(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50)  # Birth Certificate, Photo, etc.
    file = models.FileField(upload_to='student_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

#### 4.2.2 Features Implementation
- **Student Registration**: Django forms with validation
- **Admission Number Generation**: Auto-generated unique IDs
- **Profile Management**: Django admin + custom frontend forms
- **Bulk Import**: Django management command for CSV processing
- **Search & Filter**: Django ORM with complex queries
- **Promotion System**: Automated class promotion with validation

#### 4.2.3 Student Services
```python
# apps/students/services.py
from django.db import transaction
import csv
from io import StringIO

class StudentService:
    
    @staticmethod
    @transaction.atomic
    def create_student_profile(user_data, student_data):
        """Create student with user account and profile"""
        user = User.objects.create_user(
            username=student_data['admission_number'],
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role='STUDENT'
        )
        
        student = Student.objects.create(
            user=user,
            **student_data
        )
        return student
    
    @staticmethod
    def bulk_import_students(csv_file):
        """Import students from CSV file"""
        # Implementation for CSV processing
        pass
    
    @staticmethod
    def promote_students_to_next_class(current_class, next_class):
        """Promote all students to next class"""
        students = Student.objects.filter(current_class=current_class)
        # Implementation for promotion logic
        return students.update(current_class=next_class)
```

### 4.3 Teacher Management

#### 4.3.1 Django Models
```python
# apps/teachers/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    joining_date = models.DateField()
    designation = models.CharField(max_length=100)
    qualification = models.JSONField()  # List of qualifications
    experience_years = models.PositiveIntegerField(default=0)
    subjects = models.ManyToManyField('academic.Subject', related_name='teachers')
    is_class_teacher = models.BooleanField(default=False)
    class_assigned = models.OneToOneField('academic.Class', null=True, blank=True, on_delete=models.SET_NULL)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bank_details = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class TeacherDocument(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50)
    file = models.FileField(upload_to='teacher_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

#### 4.3.2 Teacher Features
- **Profile Management**: Comprehensive teacher profiles
- **Subject Assignment**: Many-to-many relationship with subjects
- **Class Teacher Assignment**: One-to-one relationship with classes
- **Qualification Tracking**: JSON field for flexible qualification storage
- **Document Management**: File uploads for certificates and documents

### 4.4 Parent Management

#### 4.4.1 Django Models
```python
# apps/parents/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Parent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    occupation = models.CharField(max_length=100, blank=True)
    office_address = models.JSONField(null=True, blank=True)
    communication_preferences = models.JSONField(default=dict)  # Email, SMS, App notifications
    is_primary_contact = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ParentStudentRelation(models.Model):
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='children')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='parents')
    relationship = models.CharField(max_length=20, choices=[
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('GUARDIAN', 'Guardian'),
    ])
    is_primary = models.BooleanField(default=False)
    can_view_grades = models.BooleanField(default=True)
    can_view_attendance = models.BooleanField(default=True)
    can_receive_notifications = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['parent', 'student']
```

### 4.5 Django Admin Integration

#### 4.5.1 Admin Configuration
```python
# apps/students/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Student, StudentDocument

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['admission_number', 'full_name', 'class_section', 'email', 'is_active']
    list_filter = ['gender', 'is_active', 'current_class__name']
    search_fields = ['admission_number', 'user__first_name', 'user__last_name', 'user__email']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']
    
    def full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    
    def class_section(self, obj):
        if hasattr(obj, 'current_class') and obj.current_class:
            return f"{obj.current_class.name} - {obj.section.name}"
        return "Not Assigned"
```

### 4.6 API Endpoints (Django REST Framework)

#### 4.6.1 Student API Endpoints
```
GET    /api/students/                    # List students (with filters)
POST   /api/students/                    # Create new student
GET    /api/students/{id}/               # Retrieve student details
PUT    /api/students/{id}/               # Update student
PATCH  /api/students/{id}/               # Partial update
DELETE /api/students/{id}/               # Delete student
POST   /api/students/bulk-import/        # Bulk import students
GET    /api/students/{id}/attendance/    # Student attendance records
GET    /api/students/{id}/grades/        # Student grades
GET    /api/students/{id}/fees/          # Student fee records
POST   /api/students/{id}/documents/    # Upload documents
GET    /api/students/search/             # Advanced search
```

#### 4.6.2 Teacher API Endpoints
```
GET    /api/teachers/                    # List teachers
POST   /api/teachers/                    # Create teacher
GET    /api/teachers/{id}/               # Teacher details
PUT    /api/teachers/{id}/               # Update teacher
DELETE /api/teachers/{id}/               # Delete teacher
GET    /api/teachers/{id}/schedule/      # Teacher schedule
GET    /api/teachers/{id}/classes/       # Assigned classes
GET    /api/teachers/{id}/subjects/      # Assigned subjects
POST   /api/teachers/{id}/documents/    # Upload documents
```

#### 4.6.3 Parent API Endpoints
```
GET    /api/parents/                     # List parents
POST   /api/parents/                     # Create parent
GET    /api/parents/{id}/                # Parent details
PUT    /api/parents/{id}/                # Update parent
GET    /api/parents/{id}/children/       # Linked children
POST   /api/parents/{id}/link-student/   # Link student to parent
DELETE /api/parents/{id}/unlink-student/ # Unlink student
```

### 4.7 Views and Serializers

#### 4.7.1 API Views
```python
# apps/students/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Student
from .serializers import StudentSerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Role-based filtering
        if self.request.user.role == 'TEACHER':
            # Teachers can only see students in their classes
            queryset = queryset.filter(current_class__in=self.request.user.teacher_profile.classes.all())
        elif self.request.user.role == 'PARENT':
            # Parents can only see their linked children
            queryset = queryset.filter(parents__parent=self.request.user.parent_profile)
        return queryset
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        student = self.get_object()
        # Return attendance records
        pass
    
    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        # Handle bulk student import
        pass
```