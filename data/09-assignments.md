# Assignment & Homework Module

## Django Assignment Management System

### 6.1 Architecture Overview
- **Django Models**: Comprehensive assignment and submission tracking
- **File Management**: Django file handling for assignments and submissions
- **Admin Interface**: Django admin for assignment management
- **REST API**: Full CRUD operations for frontend integration
- **Validation**: Django validators for assignment constraints
- **Notifications**: Email and in-app notifications for assignments
- **Grading**: Flexible grading system with rubrics

### 6.2 Assignment Models

#### 6.2.1 Core Assignment Models
```python
# apps/assignments/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

class Assignment(models.Model):
    ASSIGNMENT_TYPES = [
        ('HOMEWORK', 'Homework'),
        ('PROJECT', 'Project'),
        ('QUIZ', 'Quiz'),
        ('EXAM', 'Exam'),
        ('PRACTICAL', 'Practical'),
        ('PRESENTATION', 'Presentation'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPES, default='HOMEWORK')
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey('academic.Subject', on_delete=models.CASCADE)
    class_obj = models.ForeignKey('academic.Class', on_delete=models.CASCADE, related_name='assignments')
    academic_year = models.ForeignKey('academic.AcademicYear', on_delete=models.CASCADE)
    term = models.ForeignKey('academic.Term', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Dates and timing
    assigned_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    late_submission_allowed = models.BooleanField(default=True)
    late_penalty_percentage = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)])
    
    # Grading
    total_marks = models.PositiveIntegerField(default=100)
    max_marks = models.PositiveIntegerField(default=100)
    grading_rubric = models.JSONField(default=dict, blank=True)  # Rubric structure
    auto_grade = models.BooleanField(default=False)
    
    # Visibility and access
    is_published = models.BooleanField(default=False)
    is_draft = models.BooleanField(default=True)
    allow_multiple_submissions = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-assigned_date']
        indexes = [
            models.Index(fields=['class_obj', 'subject', 'due_date']),
            models.Index(fields=['teacher', 'is_published']),
            models.Index(fields=['academic_year', 'term']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.class_obj.name}"
    
    @property
    def is_overdue(self):
        return timezone.now() > self.due_date
    
    @property
    def days_until_due(self):
        delta = self.due_date - timezone.now()
        return delta.days
    
    def get_submitted_students(self):
        return User.objects.filter(
            assignment_submissions__assignment=self,
            assignment_submissions__is_submitted=True
        ).distinct()
    
    def get_pending_students(self):
        class_students = self.class_obj.student_set.all()
        submitted_students = self.get_submitted_students()
        return class_students.exclude(id__in=submitted_students)

class AssignmentAttachment(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='assignments/attachments/%Y/%m/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.PositiveIntegerField()
    description = models.CharField(max_length=500, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']

class AssignmentSubmission(models.Model):
    SUBMISSION_STATUS = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('LATE', 'Late Submission'),
        ('GRADED', 'Graded'),
        ('RETURNED', 'Returned'),
    ]
    
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions')
    
    # Submission content
    text_content = models.TextField(blank=True)
    submission_status = models.CharField(max_length=20, choices=SUBMISSION_STATUS, default='DRAFT')
    
    # Timing
    submitted_at = models.DateTimeField(null=True, blank=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    # Grading
    marks_obtained = models.PositiveIntegerField(null=True, blank=True)
    grade = models.CharField(max_length=10, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey('teachers.Teacher', null=True, blank=True, on_delete=models.SET_NULL)
    graded_at = models.DateTimeField(null=True, blank=True)
    
    # Late submission
    is_late = models.BooleanField(default=False)
    late_minutes = models.PositiveIntegerField(default=0)
    late_penalty_applied = models.BooleanField(default=False)
    
    # Academic integrity
    plagiarism_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    plagiarism_report = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['assignment', 'submission_status']),
            models.Index(fields=['student', 'submission_status']),
            models.Index(fields=['graded_by', 'graded_at']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.assignment.title}"
    
    def save(self, *args, **kwargs):
        # Check if submission is late
        if self.submitted_at and self.submitted_at > self.assignment.due_date:
            self.is_late = True
            time_diff = self.submitted_at - self.assignment.due_date
            self.late_minutes = int(time_diff.total_seconds() // 60)
        
        super().save(*args, **kwargs)
    
    def calculate_final_marks(self):
        """Calculate final marks after late penalty"""
        if self.marks_obtained is None:
            return None
        
        final_marks = self.marks_obtained
        if self.is_late and self.assignment.late_penalty_percentage > 0:
            penalty = (self.marks_obtained * self.assignment.late_penalty_percentage) / 100
            final_marks = max(0, self.marks_obtained - penalty)
        
        return final_marks

class SubmissionAttachment(models.Model):
    submission = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='assignments/submissions/%Y/%m/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']

class AssignmentComment(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='comments')
    submission = models.ForeignKey(AssignmentSubmission, null=True, blank=True, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_private = models.BooleanField(default=False)  # Private comment between teacher and student
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['assignment', 'is_private']),
            models.Index(fields=['submission', 'created_at']),
        ]
```

### 6.3 Assignment Services

#### 6.3.1 Assignment Management Services
```python
# apps/assignments/services.py
from django.db import transaction
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from .models import Assignment, AssignmentSubmission, AssignmentAttachment
from notifications.models import Notification

class AssignmentService:
    
    @staticmethod
    @transaction.atomic
    def create_assignment(teacher, assignment_data, files=None):
        """Create new assignment with optional attachments"""
        assignment = Assignment.objects.create(
            teacher=teacher,
            **assignment_data
        )
        
        # Add attachments if provided
        if files:
            for file_data in files:
                AssignmentAttachment.objects.create(
                    assignment=assignment,
                    file=file_data['file'],
                    filename=file_data['filename'],
                    file_type=file_data['file_type'],
                    file_size=file_data['file_size'],
                    description=file_data.get('description', '')
                )
        
        return assignment
    
    @staticmethod
    @transaction.atomic
    def publish_assignment(assignment):
        """Publish assignment and notify students"""
        assignment.is_published = True
        assignment.is_draft = False
        assignment.save()
        
        # Create notifications for all students in the class
        students = assignment.class_obj.student_set.all()
        notifications = []
        
        for student in students:
            notifications.append(
                Notification(
                    user=student,
                    notification_type='ASSIGNMENT',
                    title=f'New Assignment: {assignment.title}',
                    message=f'A new assignment has been posted for {assignment.subject.name}',
                    data={
                        'assignment_id': assignment.id,
                        'class_id': assignment.class_obj.id,
                        'subject_id': assignment.subject.id,
                        'due_date': assignment.due_date.isoformat()
                    }
                )
            )
        
        Notification.objects.bulk_create(notifications)
        
        # Send email notifications
        try:
            for student in students:
                send_mail(
                    subject=f'New Assignment: {assignment.title}',
                    message=f'Dear {student.get_full_name()},\n\n'
                           f'A new assignment "{assignment.title}" has been posted for {assignment.subject.name}.\n'
                           f'Due Date: {assignment.due_date.strftime("%B %d, %Y at %I:%M %p")}\n\n'
                           f'Please log in to view and submit the assignment.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[student.email],
                    fail_silently=True
                )
        except Exception:
            pass  # Email failure should not stop the process
        
        return assignment
    
    @staticmethod
    @transaction.atomic
    def submit_assignment(student, assignment, submission_data, files=None):
        """Submit assignment with optional attachments"""
        submission, created = AssignmentSubmission.objects.get_or_create(
            assignment=assignment,
            student=student,
            defaults={
                'submission_status': 'SUBMITTED',
                'submitted_at': timezone.now(),
                'text_content': submission_data.get('text_content', '')
            }
        )
        
        if not created:
            # Update existing submission
            submission.text_content = submission_data.get('text_content', '')
            submission.submission_status = 'SUBMITTED'
            submission.submitted_at = timezone.now()
            submission.save()
        
        # Add attachments if provided
        if files:
            # Remove existing attachments if multiple submissions not allowed
            if not assignment.allow_multiple_submissions:
                submission.attachments.all().delete()
            
            for file_data in files:
                SubmissionAttachment.objects.create(
                    submission=submission,
                    file=file_data['file'],
                    filename=file_data['filename'],
                    file_type=file_data['file_type'],
                    file_size=file_data['file_size']
                )
        
        # Notify teacher
        Notification.objects.create(
            user=assignment.teacher.user,
            notification_type='ASSIGNMENT_SUBMISSION',
            title=f'New Submission: {assignment.title}',
            message=f'{student.get_full_name()} has submitted their assignment.',
            data={
                'assignment_id': assignment.id,
                'submission_id': submission.id,
                'student_id': student.id
            }
        )
        
        return submission
    
    @staticmethod
    @transaction.atomic
    def grade_submission(teacher, submission, grade_data):
        """Grade assignment submission"""
        submission.marks_obtained = grade_data['marks_obtained']
        submission.grade = grade_data.get('grade', '')
        submission.feedback = grade_data.get('feedback', '')
        submission.graded_by = teacher
        submission.graded_at = timezone.now()
        submission.submission_status = 'GRADED'
        
        # Apply late penalty if applicable
        if submission.is_late and submission.assignment.late_penalty_percentage > 0:
            submission.late_penalty_applied = True
        
        submission.save()
        
        # Notify student
        Notification.objects.create(
            user=submission.student,
            notification_type='ASSIGNMENT_GRADED',
            title=f'Assignment Graded: {submission.assignment.title}',
            message=f'Your assignment has been graded. Score: {submission.marks_obtained}/{submission.assignment.total_marks}',
            data={
                'assignment_id': submission.assignment.id,
                'submission_id': submission.id,
                'marks_obtained': submission.marks_obtained,
                'grade': submission.grade
            }
        )
        
        return submission
    
    @staticmethod
    def get_assignment_statistics(assignment):
        """Get comprehensive assignment statistics"""
        total_students = assignment.class_obj.current_students
        submitted_count = assignment.submissions.filter(
            submission_status__in=['SUBMITTED', 'LATE', 'GRADED', 'RETURNED']
        ).count()
        graded_count = assignment.submissions.filter(submission_status='GRADED').count()
        late_count = assignment.submissions.filter(is_late=True).count()
        
        # Calculate average marks
        graded_submissions = assignment.submissions.filter(
            marks_obtained__isnull=False
        )
        avg_marks = graded_submissions.aggregate(
            avg=models.Avg('marks_obtained')
        )['avg'] or 0
        
        return {
            'total_students': total_students,
            'submitted_count': submitted_count,
            'pending_count': total_students - submitted_count,
            'graded_count': graded_count,
            'late_count': late_count,
            'submission_rate': (submitted_count / total_students * 100) if total_students > 0 else 0,
            'grading_rate': (graded_count / submitted_count * 100) if submitted_count > 0 else 0,
            'average_marks': avg_marks,
            'average_percentage': (avg_marks / assignment.total_marks * 100) if assignment.total_marks > 0 else 0
        }
    
    @staticmethod
    def get_student_assignments(student, status_filter=None):
        """Get assignments for a specific student with optional status filtering"""
        assignments = Assignment.objects.filter(
            class_obj__in=student.student_classes.all(),
            is_published=True
        )
        
        if status_filter:
            if status_filter == 'pending':
                assignments = assignments.filter(
                    due_date__gt=timezone.now()
                ).exclude(
                    submissions__student=student,
                    submissions__submission_status__in=['SUBMITTED', 'LATE', 'GRADED', 'RETURNED']
                )
            elif status_filter == 'submitted':
                assignments = assignments.filter(
                    submissions__student=student,
                    submissions__submission_status__in=['SUBMITTED', 'LATE']
                )
            elif status_filter == 'graded':
                assignments = assignments.filter(
                    submissions__student=student,
                    submissions__submission_status='GRADED'
                )
            elif status_filter == 'overdue':
                assignments = assignments.filter(
                    due_date__lt=timezone.now()
                ).exclude(
                    submissions__student=student,
                    submissions__submission_status__in=['SUBMITTED', 'LATE', 'GRADED', 'RETURNED']
                )
        
        return assignments.distinct()
    
    @staticmethod
    def get_teacher_assignments(teacher, filters=None):
        """Get assignments for a specific teacher with optional filters"""
        assignments = Assignment.objects.filter(teacher=teacher)
        
        if filters:
            if filters.get('class_id'):
                assignments = assignments.filter(class_obj_id=filters['class_id'])
            if filters.get('subject_id'):
                assignments = assignments.filter(subject_id=filters['subject_id'])
            if filters.get('status') == 'draft':
                assignments = assignments.filter(is_draft=True)
            elif filters.get('status') == 'published':
                assignments = assignments.filter(is_published=True)
            elif filters.get('status') == 'due_soon':
                assignments = assignments.filter(
                    due_date__lte=timezone.now() + timezone.timedelta(days=3),
                    due_date__gt=timezone.now()
                )
        
        return assignments
```

### 6.4 Django Admin Integration

#### 6.4.1 Admin Configuration
```python
# apps/assignments/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg, Count
from .models import Assignment, AssignmentSubmission, AssignmentAttachment, SubmissionAttachment

class AssignmentAttachmentInline(admin.TabularInline):
    model = AssignmentAttachment
    extra = 0
    readonly_fields = ['file_size', 'uploaded_at']

class SubmissionAttachmentInline(admin.TabularInline):
    model = SubmissionAttachment
    extra = 0
    readonly_fields = ['file_size', 'uploaded_at']

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'class_obj', 'subject', 'teacher', 
        'due_date', 'total_marks', 'is_published', 'submission_count'
    ]
    list_filter = [
        'assignment_type', 'is_published', 'is_draft', 
        'late_submission_allowed', 'academic_year', 'term'
    ]
    search_fields = [
        'title', 'description', 'class_obj__name', 
        'subject__name', 'teacher__user__first_name'
    ]
    raw_id_fields = ['teacher', 'subject', 'class_obj']
    inlines = [AssignmentAttachmentInline]
    date_hierarchy = 'assigned_date'
    
    def submission_count(self, obj):
        submitted = obj.submissions.filter(
            submission_status__in=['SUBMITTED', 'LATE', 'GRADED', 'RETURNED']
        ).count()
        total = obj.class_obj.current_students
        return f"{submitted}/{total}"
    submission_count.short_description = 'Submissions'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role == 'TEACHER':
            return qs.filter(teacher=request.user.teacher_profile)
        return qs

@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'assignment', 'student', 'submission_status', 
        'submitted_at', 'marks_obtained', 'is_late'
    ]
    list_filter = [
        'submission_status', 'is_late', 'graded_by', 
        'assignment__assignment_type'
    ]
    search_fields = [
        'assignment__title', 'student__first_name', 
        'student__last_name', 'feedback'
    ]
    raw_id_fields = ['assignment', 'student', 'graded_by']
    inlines = [SubmissionAttachmentInline]
    date_hierarchy = 'submitted_at'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role == 'TEACHER':
            return qs.filter(assignment__teacher=request.user.teacher_profile)
        elif request.user.role == 'STUDENT':
            return qs.filter(student=request.user)
        return qs
```

### 6.5 API Endpoints (Django REST Framework)

#### 6.5.1 Assignment API
```
GET    /api/assignments/                          # List assignments
POST   /api/assignments/                          # Create assignment
GET    /api/assignments/{id}/                     # Assignment details
PUT    /api/assignments/{id}/                    # Update assignment
DELETE /api/assignments/{id}/                    # Delete assignment
POST   /api/assignments/{id}/publish/            # Publish assignment
POST   /api/assignments/{id}/duplicate/          # Duplicate assignment

GET    /api/assignments/student/                  # Student assignments
GET    /api/assignments/teacher/                 # Teacher assignments
GET    /api/assignments/pending/                  # Pending assignments
GET    /api/assignments/overdue/                 # Overdue assignments

GET    /api/assignments/{id}/submissions/        # Assignment submissions
POST   /api/assignments/{id}/submissions/        # Submit assignment
GET    /api/assignments/submissions/{id}/         # Submission details
PUT    /api/assignments/submissions/{id}/         # Update submission
POST   /api/assignments/submissions/{id}/grade/  # Grade submission
POST   /api/assignments/submissions/{id}/return/  # Return submission

GET    /api/assignments/{id}/statistics/          # Assignment statistics
GET    /api/assignments/{id}/attachments/         # Assignment attachments
POST   /api/assignments/{id}/attachments/         # Upload attachment
GET    /api/assignments/submissions/{id}/attachments/  # Submission attachments
POST   /api/assignments/submissions/{id}/attachments/  # Upload submission

GET    /api/assignments/comments/                 # Assignment comments
POST   /api/assignments/comments/                 # Add comment
PUT    /api/assignments/comments/{id}/            # Update comment
DELETE /api/assignments/comments/{id}/           # Delete comment

POST   /api/assignments/bulk-grade/               # Bulk grade submissions
GET    /api/assignments/export/{id}/              # Export assignment data
POST   /api/assignments/import/                   # Import assignments
```

#### 6.5.2 Assignment Views
```python
# apps/assignments/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count
from .models import Assignment, AssignmentSubmission
from .serializers import AssignmentSerializer, AssignmentSubmissionSerializer
from .services import AssignmentService

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['class_obj', 'subject', 'assignment_type', 'is_published']
    search_fields = ['title', 'description']
    ordering_fields = ['assigned_date', 'due_date', 'title']
    ordering = ['-assigned_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Assignment.objects.filter(teacher=user.teacher_profile)
        elif user.role == 'STUDENT':
            return Assignment.objects.filter(
                class_obj__in=user.student_classes.all(),
                is_published=True
            )
        return super().get_queryset()
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish assignment"""
        assignment = self.get_object()
        try:
            AssignmentService.publish_assignment(assignment)
            return Response({'message': 'Assignment published successfully'})
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate assignment"""
        assignment = self.get_object()
        
        # Create duplicate
        new_assignment = Assignment.objects.create(
            title=f"{assignment.title} (Copy)",
            description=assignment.description,
            assignment_type=assignment.assignment_type,
            teacher=assignment.teacher,
            subject=assignment.subject,
            class_obj=assignment.class_obj,
            academic_year=assignment.academic_year,
            term=assignment.term,
            total_marks=assignment.total_marks,
            max_marks=assignment.max_marks,
            grading_rubric=assignment.grading_rubric,
            late_submission_allowed=assignment.late_submission_allowed,
            late_penalty_percentage=assignment.late_penalty_percentage,
            allow_multiple_submissions=assignment.allow_multiple_submissions,
            is_draft=True,
            is_published=False
        )
        
        serializer = self.get_serializer(new_assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get assignment statistics"""
        assignment = self.get_object()
        stats = AssignmentService.get_assignment_statistics(assignment)
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending assignments for current user"""
        if request.user.role == 'STUDENT':
            assignments = AssignmentService.get_student_assignments(
                request.user, status_filter='pending'
            )
        else:
            assignments = Assignment.objects.none()
        
        page = self.paginate_queryset(assignments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue assignments for current user"""
        if request.user.role == 'STUDENT':
            assignments = AssignmentService.get_student_assignments(
                request.user, status_filter='overdue'
            )
        else:
            assignments = Assignment.objects.none()
        
        page = self.paginate_queryset(assignments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['assignment', 'submission_status', 'is_late']
    ordering_fields = ['submitted_at', 'last_modified']
    ordering = ['-submitted_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return AssignmentSubmission.objects.filter(
                assignment__teacher=user.teacher_profile
            )
        elif user.role == 'STUDENT':
            return AssignmentSubmission.objects.filter(student=user)
        return super().get_queryset()
    
    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade submission"""
        submission = self.get_object()
        
        # Check if user is the assignment teacher or has grading permissions
        if (request.user.role != 'TEACHER' or 
            submission.assignment.teacher != request.user.teacher_profile):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            graded_submission = AssignmentService.grade_submission(
                request.user.teacher_profile,
                submission,
                request.data
            )
            serializer = self.get_serializer(graded_submission)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def return_to_student(self, request, pk=None):
        """Return submission to student for revision"""
        submission = self.get_object()
        
        if (request.user.role != 'TEACHER' or 
            submission.assignment.teacher != request.user.teacher_profile):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        submission.submission_status = 'RETURNED'
        submission.feedback = request.data.get('feedback', submission.feedback)
        submission.save()
        
        # Notify student
        Notification.objects.create(
            user=submission.student,
            notification_type='ASSIGNMENT_RETURNED',
            title=f'Assignment Returned: {submission.assignment.title}',
            message=f'Your assignment has been returned for revision. Please check the feedback.',
            data={
                'assignment_id': submission.assignment.id,
                'submission_id': submission.id
            }
        )
        
        return Response({'message': 'Assignment returned to student'})
```