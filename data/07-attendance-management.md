# Attendance Management Module

## Django Attendance Management System

### 6.1 Architecture Overview
- **Django Models**: Comprehensive attendance tracking with relationships
- **Real-time Updates**: Django Channels for live attendance updates
- **Notification System**: Automated parent notifications via email/SMS
- **Analytics**: Attendance statistics and trend analysis
- **Bulk Operations**: Efficient batch attendance marking
- **Integration**: Seamless integration with timetable and user management

### 6.2 Attendance Models

#### 6.2.1 Core Attendance Models
```python
# apps/attendance/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from academic.models import Class, TimeSlot

User = get_user_model()

class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('HALF_DAY', 'Half Day'),
        ('ON_LEAVE', 'On Leave'),
        ('EXCUSED', 'Excused'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PRESENT')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='attendance_records')
    time_slot = models.ForeignKey(TimeSlot, null=True, blank=True, on_delete=models.SET_NULL)
    subject = models.ForeignKey('academic.Subject', null=True, blank=True, on_delete=models.SET_NULL)
    marked_by = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='marked_attendance')
    remarks = models.TextField(blank=True)
    late_minutes = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='verified_attendance')
    marked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'date', 'class_obj', 'time_slot']
        ordering = ['-date', 'student']
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['class_obj', 'date']),
            models.Index(fields=['status', 'date']),
        ]
    
    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"

class AttendanceSession(models.Model):
    """For tracking attendance marking sessions"""
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE)
    date = models.DateField()
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    total_students = models.PositiveIntegerField()
    marked_students = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['teacher', 'class_obj', 'date', 'time_slot']

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    approval_remarks = models.TextField(blank=True)
    supporting_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    parent_approved = models.BooleanField(default=False)
    parent_approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
```

#### 6.2.2 Attendance Analytics Models
```python
class AttendanceSummary(models.Model):
    """Pre-calculated attendance summaries for performance"""
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_summaries')
    academic_year = models.ForeignKey('academic.AcademicYear', on_delete=models.CASCADE)
    month = models.DateField()  # First day of the month
    total_days = models.PositiveIntegerField()
    present_days = models.PositiveIntegerField()
    absent_days = models.PositiveIntegerField()
    late_days = models.PositiveIntegerField()
    leave_days = models.PositiveIntegerField()
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'academic_year', 'month']
        indexes = [
            models.Index(fields=['student', 'academic_year']),
            models.Index(fields=['attendance_percentage']),
        ]

class AttendanceNotification(models.Model):
    """Track attendance-related notifications"""
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_notifications')
    notification_type = models.CharField(max_length=20, choices=[
        ('ABSENCE', 'Absence Alert'),
        ('LOW_ATTENDANCE', 'Low Attendance Warning'),
        ('LEAVE_APPROVAL', 'Leave Request Update'),
    ])
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_notifications')
    message = models.TextField()
    is_sent = models.BooleanField(default=False)
    sent_via = models.CharField(max_length=20, choices=[
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('PUSH', 'Push Notification'),
    ])
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 6.3 Attendance Services

#### 6.3.1 Attendance Management Services
```python
# apps/attendance/services.py
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AttendanceService:
    
    @staticmethod
    @transaction.atomic
    def mark_class_attendance(teacher, class_obj, date, time_slot, attendance_data):
        """Mark attendance for entire class"""
        # Create attendance session
        session, created = AttendanceSession.objects.get_or_create(
            teacher=teacher,
            class_obj=class_obj,
            date=date,
            time_slot=time_slot,
            defaults={'total_students': class_obj.current_students}
        )
        
        # Process attendance data
        attendance_records = []
        for student_id, status_data in attendance_data.items():
            student = class_obj.student_set.get(id=student_id)
            
            record = AttendanceRecord(
                student=student,
                date=date,
                status=status_data['status'],
                class_obj=class_obj,
                time_slot=time_slot,
                subject=time_slot.subject,
                marked_by=teacher,
                remarks=status_data.get('remarks', ''),
                late_minutes=status_data.get('late_minutes', 0)
            )
            attendance_records.append(record)
        
        # Bulk create attendance records
        AttendanceRecord.objects.bulk_create(
            attendance_records,
            ignore_conflicts=True
        )
        
        # Update session
        session.marked_students = len(attendance_records)
        session.is_completed = True
        session.completed_at = timezone.now()
        session.save()
        
        # Trigger notifications for absent students
        AttendanceService._send_absence_notifications(attendance_records)
        
        return session
    
    @staticmethod
    def _send_absence_notifications(attendance_records):
        """Send notifications to parents for absent students"""
        absent_records = [
            record for record in attendance_records 
            if record.status == 'ABSENT'
        ]
        
        for record in absent_records:
            # Get parents
            parents = record.student.parents.all()
            
            for parent in parents:
                # Create notification record
                notification = AttendanceNotification.objects.create(
                    student=record.student,
                    notification_type='ABSENCE',
                    recipient=parent.user,
                    message=f"Your child {record.student.user.get_full_name()} was absent from school on {record.date}.",
                    sent_via='EMAIL'
                )
                
                # Send email
                try:
                    send_mail(
                        subject=f'Absence Alert - {record.student.user.get_full_name()}',
                        message=f"Dear Parent,\n\nYour child {record.student.user.get_full_name()} was marked absent from school on {record.date}.\n\nPlease contact the school if this is incorrect.\n\nRegards,\nSchool Management",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[parent.user.email],
                        fail_silently=False,
                    )
                    notification.is_sent = True
                    notification.sent_at = timezone.now()
                    notification.save()
                except Exception as e:
                    logger.error(f"Failed to send absence notification: {e}")
    
    @staticmethod
    def calculate_attendance_summary(student, academic_year, month):
        """Calculate attendance summary for a student"""
        start_date = month
        if month.month == 12:
            end_date = month.replace(year=month.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = month.replace(month=month.month + 1, day=1) - timedelta(days=1)
        
        records = AttendanceRecord.objects.filter(
            student=student,
            date__range=[start_date, end_date]
        )
        
        total_days = records.count()
        if total_days == 0:
            return None
        
        present_days = records.filter(status='PRESENT').count()
        absent_days = records.filter(status='ABSENT').count()
        late_days = records.filter(status='LATE').count()
        leave_days = records.filter(status='ON_LEAVE').count()
        
        attendance_percentage = (present_days / total_days) * 100
        
        summary, created = AttendanceSummary.objects.update_or_create(
            student=student,
            academic_year=academic_year,
            month=month,
            defaults={
                'total_days': total_days,
                'present_days': present_days,
                'absent_days': absent_days,
                'late_days': late_days,
                'leave_days': leave_days,
                'attendance_percentage': attendance_percentage
            }
        )
        
        return summary
```

### 6.4 Django Admin Integration

#### 6.4.1 Admin Configuration
```python
# apps/attendance/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from .models import AttendanceRecord, AttendanceSession, LeaveRequest

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'status', 'class_obj', 'marked_by', 'attendance_percentage_badge']
    list_filter = ['status', 'date', 'class_obj', 'marked_by']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'class_obj__name']
    date_hierarchy = 'date'
    raw_id_fields = ['student', 'marked_by']
    
    def attendance_percentage_badge(self, obj):
        # Calculate attendance percentage for the month
        summary = AttendanceSummary.objects.filter(
            student=obj.student,
            month__year=obj.date.year,
            month__month=obj.date.month
        ).first()
        
        if summary:
            color = 'green' if summary.attendance_percentage >= 75 else 'red'
            return format_html(
                '<span style="color: {};">{:.1f}%</span>',
                color,
                summary.attendance_percentage
            )
        return 'N/A'
    attendance_percentage_badge.short_description = 'Attendance %'

class AttendanceRecordInline(admin.TabularInline):
    model = AttendanceRecord
    extra = 0

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'class_obj', 'date', 'time_slot', 'completion_status']
    list_filter = ['date', 'class_obj', 'is_completed']
    inlines = [AttendanceRecordInline]
    
    def completion_status(self, obj):
        if obj.is_completed:
            return format_html('<span style="color: green;">✓ Completed</span>')
        else:
            return format_html('<span style="color: orange;">⏳ In Progress</span>')
    completion_status.short_description = 'Status'
```

### 6.5 API Endpoints (Django REST Framework)

#### 6.5.1 Attendance API
```
GET    /api/attendance/records/              # List attendance records
POST   /api/attendance/records/              # Create attendance record
GET    /api/attendance/records/{id}/         # Attendance record details
PUT    /api/attendance/records/{id}/         # Update attendance record
POST   /api/attendance/mark-class/           # Mark class attendance
POST   /api/attendance/bulk-mark/            # Bulk attendance marking
GET    /api/attendance/class/{class_id}/date/{date}/    # Class attendance for date
GET    /api/attendance/student/{student_id}/            # Student attendance history
GET    /api/attendance/teacher/{teacher_id}/            # Teacher attendance sessions

GET    /api/attendance/sessions/             # List attendance sessions
POST   /api/attendance/sessions/             # Create attendance session
GET    /api/attendance/sessions/{id}/        # Session details
```

#### 6.5.2 Reports & Analytics API
```
GET    /api/attendance/reports/daily/{date}/           # Daily attendance report
GET    /api/attendance/reports/monthly/{month}/         # Monthly summary
GET    /api/attendance/reports/class/{class_id}/        # Class attendance report
GET    /api/attendance/reports/student/{student_id}/    # Student attendance report
GET    /api/attendance/reports/defaulter-list/         # Low attendance students
GET    /api/attendance/reports/attendance-trends/      # Attendance trends
POST   /api/attendance/reports/export/                 # Export attendance reports
```

#### 6.5.3 Leave Management API
```
GET    /api/attendance/leave-requests/         # List leave requests
POST   /api/attendance/leave-requests/         # Create leave request
GET    /api/attendance/leave-requests/{id}/    # Leave request details
PUT    /api/attendance/leave-requests/{id}/    # Update leave request
POST   /api/attendance/leave-requests/{id}/approve/  # Approve leave request
POST   /api/attendance/leave-requests/{id}/reject/   # Reject leave request
```

### 6.6 Views and Serializers

#### 6.6.1 API Views
```python
# apps/attendance/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg
from django.utils import timezone
from .models import AttendanceRecord, AttendanceSession, LeaveRequest
from .serializers import AttendanceRecordSerializer, AttendanceSessionSerializer
from .services import AttendanceService

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Role-based filtering
        if user.role == 'STUDENT':
            queryset = queryset.filter(student=user.student_profile)
        elif user.role == 'PARENT':
            queryset = queryset.filter(student__parents__parent=user.parent_profile)
        elif user.role == 'TEACHER':
            queryset = queryset.filter(marked_by=user.teacher_profile)
        
        # Date filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def mark_class(self, request):
        """Mark attendance for entire class"""
        try:
            teacher = request.user.teacher_profile
            class_id = request.data.get('class_id')
            date = request.data.get('date')
            time_slot_id = request.data.get('time_slot_id')
            attendance_data = request.data.get('attendance_data')
            
            from academic.models import Class, TimeSlot
            class_obj = Class.objects.get(id=class_id)
            time_slot = TimeSlot.objects.get(id=time_slot_id)
            
            session = AttendanceService.mark_class_attendance(
                teacher, class_obj, date, time_slot, attendance_data
            )
            
            return Response({
                'message': 'Attendance marked successfully',
                'session_id': session.id
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def reports_summary(self, request):
        """Generate attendance summary reports"""
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        class_id = request.query_params.get('class_id')
        
        queryset = self.get_queryset()
        
        # Apply filters
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Generate summary
        summary = queryset.aggregate(
            total_records=Count('id'),
            present_count=Count('id', filter=Q(status='PRESENT')),
            absent_count=Count('id', filter=Q(status='ABSENT')),
            late_count=Count('id', filter=Q(status='LATE')),
        )
        
        return Response(summary)
```