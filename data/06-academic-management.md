# Academic Management Module

## Django Academic Management System

### 5.1 Architecture Overview
- **Django Models**: Comprehensive academic structure with relationships
- **Admin Interface**: Django admin for academic management
- **REST API**: Full CRUD operations for frontend integration
- **Validation**: Django validators for academic constraints
- **Scheduling**: Automated timetable generation with conflict detection
- **Reporting**: Academic reports and analytics

### 5.2 Academic Year & Session Management

#### 5.2.1 Django Models
```python
# apps/academic/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class AcademicYear(models.Model):
    name = models.CharField(max_length=100, unique=True)  # e.g., "2023-2024"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return self.name
    
    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")

class Term(models.Model):
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50)  # e.g., "Term 1", "Semester 1"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['academic_year', 'name']
        ordering = ['start_date']

class Holiday(models.Model):
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='holidays')
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_school_wide = models.BooleanField(default=True)
    affected_classes = models.ManyToManyField('Class', blank=True)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['start_date']
```

### 5.3 Class & Section Management

#### 5.3.1 Class Models
```python
class Class(models.Model):
    name = models.CharField(max_length=50)  # e.g., "Grade 1", "Grade 10"
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    section = models.CharField(max_length=10)  # e.g., "A", "B", "C"
    class_teacher = models.OneToOneField('teachers.Teacher', null=True, blank=True, on_delete=models.SET_NULL)
    room_number = models.CharField(max_length=20, blank=True)
    capacity = models.PositiveIntegerField(default=40)
    current_students = models.PositiveIntegerField(default=0)
    subjects = models.ManyToManyField('Subject', through='ClassSubject')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['name', 'section', 'academic_year']
        ordering = ['name', 'section']
    
    def __str__(self):
        return f"{self.name} - {self.section}"
    
    @property
    def available_seats(self):
        return self.capacity - self.current_students

class Section(models.Model):
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections_list')
    name = models.CharField(max_length=10)  # e.g., "A", "B"
    capacity = models.PositiveIntegerField(default=40)
    room_number = models.CharField(max_length=20, blank=True)
    
    class Meta:
        unique_together = ['class_obj', 'name']

class ClassSubject(models.Model):
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE)
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE)
    periods_per_week = models.PositiveIntegerField(default=1)
    is_compulsory = models.BooleanField(default=True)
    credit_hours = models.PositiveIntegerField(default=1)
    
    class Meta:
        unique_together = ['class_obj', 'subject']
```

### 5.4 Subject Management

#### 5.4.1 Subject Models
```python
class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    subject_type = models.CharField(max_length=20, choices=[
        ('THEORY', 'Theory'),
        ('PRACTICAL', 'Practical'),
        ('LAB', 'Laboratory'),
        ('ELECTIVE', 'Elective'),
    ], default='THEORY')
    description = models.TextField(blank=True)
    credit_hours = models.PositiveIntegerField(default=1)
    practical_hours = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class SubjectGroup(models.Model):
    name = models.CharField(max_length=100)
    subjects = models.ManyToManyField(Subject, related_name='groups')
    applicable_classes = models.ManyToManyField(Class, related_name='subject_groups')
    is_compulsory = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Subject Group"
        verbose_name_plural = "Subject Groups"
```

### 5.5 Timetable Management

#### 5.5.1 Timetable Models
```python
class Timetable(models.Model):
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='timetables')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, null=True, blank=True, on_delete=models.SET_NULL)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['class_obj', 'academic_year', 'term']

class TimeSlot(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name='time_slots')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    period_number = models.PositiveIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE)
    room_number = models.CharField(max_length=20, blank=True)
    is_break = models.BooleanField(default=False)
    break_name = models.CharField(max_length=50, blank=True)
    
    class Meta:
        unique_together = ['timetable', 'day_of_week', 'period_number']
        ordering = ['day_of_week', 'period_number']

class TimetableTemplate(models.Model):
    name = models.CharField(max_length=100)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    periods_per_day = models.PositiveIntegerField(default=8)
    school_start_time = models.TimeField()
    school_end_time = models.TimeField()
    break_periods = models.JSONField(default=list)  # List of break periods
    
    def generate_slots(self):
        """Generate time slots based on template"""
        # Implementation for generating time slots
        pass
```

#### 5.5.2 Timetable Services
```python
# apps/academic/services.py
from django.db import transaction
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
import itertools

class TimetableService:
    
    @staticmethod
    @transaction.atomic
    def generate_timetable(class_obj, academic_year):
        """Generate automatic timetable for a class"""
        timetable = Timetable.objects.create(
            class_obj=class_obj,
            academic_year=academic_year
        )
        
        # Get class subjects and teachers
        class_subjects = ClassSubject.objects.filter(class_obj=class_obj)
        
        # Generate time slots using algorithm
        time_slots = []
        subjects_list = list(class_subjects)
        
        # Simple round-robin distribution
        day = 0
        period = 1
        
        for subject in subjects_list:
            for _ in range(subject.periods_per_week):
                time_slots.append(TimeSlot(
                    timetable=timetable,
                    day_of_week=day,
                    period_number=period,
                    subject=subject.subject,
                    teacher=subject.teacher,
                    start_time=datetime.strptime(f"08:{30 + (period-1)*45:02d}", "%H:%M").time(),
                    end_time=datetime.strptime(f"08:{30 + period*45:02d}", "%H:%M").time()
                ))
                
                period += 1
                if period > 8:  # 8 periods per day
                    period = 1
                    day += 1
                    if day > 5:  # Monday to Friday
                        day = 0
        
        TimeSlot.objects.bulk_create(time_slots)
        return timetable
    
    @staticmethod
    def check_teacher_conflict(teacher, day_of_week, period_number, exclude_slot=None):
        """Check if teacher has conflict at given time"""
        query = TimeSlot.objects.filter(
            teacher=teacher,
            day_of_week=day_of_week,
            period_number=period_number
        )
        
        if exclude_slot:
            query = query.exclude(id=exclude_slot.id)
        
        return query.exists()
    
    @staticmethod
    def check_room_conflict(room_number, day_of_week, period_number, exclude_slot=None):
        """Check if room has conflict at given time"""
        if not room_number:
            return False
            
        query = TimeSlot.objects.filter(
            room_number=room_number,
            day_of_week=day_of_week,
            period_number=period_number
        )
        
        if exclude_slot:
            query = query.exclude(id=exclude_slot.id)
        
        return query.exists()
```

### 5.6 Django Admin Integration

#### 5.6.1 Admin Configuration
```python
# apps/academic/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Class, Subject, Timetable, TimeSlot

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'section', 'academic_year', 'class_teacher', 'current_students', 'capacity']
    list_filter = ['academic_year', 'is_active']
    search_fields = ['name', 'section', 'class_teacher__user__first_name']
    raw_id_fields = ['class_teacher']
    filter_horizontal = ['subjects']

class TimeSlotInline(admin.TabularInline):
    model = TimeSlot
    extra = 0

@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ['class_obj', 'academic_year', 'term', 'is_active']
    list_filter = ['academic_year', 'term', 'is_active']
    inlines = [TimeSlotInline]
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role == 'TEACHER':
            # Teachers can only see timetables for their classes
            return qs.filter(class_obj__in=request.user.teacher_profile.classes.all())
        return qs
```

### 5.7 API Endpoints (Django REST Framework)

#### 5.7.1 Academic Management API
```
GET    /api/academic/years/              # List academic years
POST   /api/academic/years/              # Create academic year
GET    /api/academic/years/{id}/         # Academic year details
PUT    /api/academic/years/{id}/         # Update academic year

GET    /api/academic/classes/             # List classes
POST   /api/academic/classes/             # Create class
GET    /api/academic/classes/{id}/        # Class details
PUT    /api/academic/classes/{id}/        # Update class
DELETE /api/academic/classes/{id}/        # Delete class
GET    /api/academic/classes/{id}/students/ # Class students
GET    /api/academic/classes/{id}/subjects/ # Class subjects

GET    /api/academic/subjects/           # List subjects
POST   /api/academic/subjects/           # Create subject
GET    /api/academic/subjects/{id}/      # Subject details
PUT    /api/academic/subjects/{id}/      # Update subject

GET    /api/academic/timetables/         # List timetables
POST   /api/academic/timetables/         # Create timetable
GET    /api/academic/timetables/{id}/    # Timetable details
POST   /api/academic/timetables/{id}/generate/ # Generate timetable
GET    /api/academic/timetables/{id}/slots/   # Time slots
PUT    /api/academic/timetables/slots/{id}/   # Update time slot

GET    /api/academic/holidays/           # List holidays
POST   /api/academic/holidays/           # Create holiday
```

#### 5.7.2 Timetable API
```
GET    /api/academic/timetable/student/{student_id}/    # Student timetable
GET    /api/academic/timetable/teacher/{teacher_id}/    # Teacher timetable
GET    /api/academic/timetable/class/{class_id}/       # Class timetable
GET    /api/academic/timetable/conflicts/               # Check conflicts
POST   /api/academic/timetable/export/{class_id}/       # Export timetable PDF
```

### 5.8 Views and Serializers

#### 5.8.1 API Views
```python
# apps/academic/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Class, Timetable, TimeSlot
from .serializers import ClassSerializer, TimetableSerializer
from .services import TimetableService

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate automatic timetable"""
        timetable = self.get_object()
        try:
            TimetableService.generate_timetable(
                timetable.class_obj, 
                timetable.academic_year
            )
            return Response({'message': 'Timetable generated successfully'})
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Export timetable as PDF"""
        timetable = self.get_object()
        # PDF export implementation
        pass
```