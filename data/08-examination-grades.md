# Examination & Grades Module

## Django Examination & Grades Management System

### 7.1 Architecture Overview
- **Django Models**: Comprehensive examination and grades tracking
- **Grade Calculation**: Automatic grade and GPA calculation based on configurable scales
- **Report Generation**: Dynamic PDF report cards with customizable templates
- **Approval Workflow**: Multi-level grade approval process
- **Analytics**: Performance analytics and trend analysis
- **Integration**: Seamless integration with academic management and attendance

### 7.2 Examination Models

#### 7.2.1 Core Examination Models
```python
# apps/examination/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from academic.models import Class, Subject, AcademicYear
from students.models import Student

class ExamType(models.Model):
    """Types of examinations"""
    name = models.CharField(max_length=100, unique=True)  # e.g., "Mid-term", "Final", "Unit Test"
    code = models.CharField(max_length=20, unique=True)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Weightage in final grade (%)")
    max_marks = models.PositiveIntegerField(default=100)
    passing_marks = models.PositiveIntegerField(default=40)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class Exam(models.Model):
    """Individual exam instances"""
    name = models.CharField(max_length=200)
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name='exams')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='exams')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exams')
    date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField()
    total_marks = models.PositiveIntegerField()
    passing_marks = models.PositiveIntegerField()
    instructions = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    created_by = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='created_exams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['class_obj', 'subject', 'exam_type', 'academic_year']
        ordering = ['-date', 'class_obj', 'subject']
    
    def __str__(self):
        return f"{self.class_obj} - {self.subject} - {self.exam_type}"

class ExamSchedule(models.Model):
    """Overall exam schedule for a class/academic year"""
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='exam_schedules')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['academic_year', 'class_obj']
```

#### 7.2.2 Grade Models
```python
class GradeScale(models.Model):
    """Configurable grade scales"""
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)  # e.g., "Standard", "Honors"
    is_default = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.name} ({self.academic_year})"

class GradeRange(models.Model):
    """Grade ranges within a scale"""
    grade_scale = models.ForeignKey(GradeScale, on_delete=models.CASCADE, related_name='grade_ranges')
    grade = models.CharField(max_length=5)  # e.g., "A+", "A", "B+"
    min_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    max_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    grade_points = models.DecimalField(max_digits=3, decimal_places=2)  # GPA points
    description = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-min_percentage']
    
    def __str__(self):
        return f"{self.grade} ({self.min_percentage}% - {self.max_percentage}%)"

class StudentGrade(models.Model):
    """Individual student grades for exams"""
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='student_grades')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exam_grades')
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=5, null=True, blank=True)
    grade_points = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    remarks = models.TextField(blank=True)
    is_absent = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL)
    approved_at = models.DateTimeField(null=True, blank=True)
    entered_by = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='entered_grades')
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['exam', 'student']
        indexes = [
            models.Index(fields=['student', 'exam']),
            models.Index(fields=['exam', 'grade']),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate percentage
        if self.marks_obtained and self.exam.total_marks:
            self.percentage = (self.marks_obtained / self.exam.total_marks) * 100
            # Calculate grade and grade points
            self.calculate_grade()
        super().save(*args, **kwargs)
    
    def calculate_grade(self):
        """Calculate grade and grade points based on percentage"""
        if self.percentage is None:
            return
        
        grade_scale = GradeScale.objects.filter(
            academic_year=self.exam.academic_year,
            is_default=True
        ).first()
        
        if grade_scale:
            grade_range = grade_scale.grade_ranges.filter(
                min_percentage__lte=self.percentage,
                max_percentage__gte=self.percentage
            ).first()
            
            if grade_range:
                self.grade = grade_range.grade
                self.grade_points = grade_range.grade_points

class GradeComment(models.Model):
    """Teacher comments for student grades"""
    student_grade = models.OneToOneField(StudentGrade, on_delete=models.CASCADE, related_name='comment')
    comment = models.TextField()
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    teacher_suggestions = models.TextField(blank=True)
    created_by = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### 7.2.3 Report Card Models
```python
class ReportCard(models.Model):
    """Generated report cards"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='report_cards')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    term = models.ForeignKey('academic.Term', null=True, blank=True, on_delete=models.SET_NULL)
    exam_type = models.ForeignKey(ExamType, null=True, blank=True, on_delete=models.SET_NULL)
    total_marks = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    total_obtained = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    overall_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_grade = models.CharField(max_length=5, null=True, blank=True)
    overall_grade_points = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    class_rank = models.PositiveIntegerField(null=True, blank=True)
    total_students = models.PositiveIntegerField(null=True, blank=True)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    principal_remarks = models.TextField(blank=True)
    class_teacher_remarks = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    pdf_file = models.FileField(upload_to='report_cards/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'academic_year', 'term', 'exam_type']
        ordering = ['-academic_year', '-created_at']

class ReportCardSubjectGrade(models.Model):
    """Subject-wise grades in report card"""
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='subject_grades')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5)
    grade_points = models.DecimalField(max_digits=3, decimal_places=2)
    remarks = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['report_card', 'subject']
```

### 7.3 Examination Services

#### 7.3.1 Grade Calculation Services
```python
# apps/examination/services.py
from django.db import transaction
from django.db.models import Avg, Sum, Count, F, Window
from django.db.models.functions import Rank
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class GradeCalculationService:
    
    @staticmethod
    @transaction.atomic
    def calculate_student_rank(student, exam_type, academic_year, class_obj):
        """Calculate student rank for a specific exam and class"""
        # Get all student grades for this exam type and class
        student_grades = StudentGrade.objects.filter(
            exam__exam_type=exam_type,
            exam__academic_year=academic_year,
            exam__class_obj=class_obj,
            is_approved=True
        ).values('student_id').annotate(
            total_obtained=Sum('marks_obtained'),
            total_marks=Sum('exam__total_marks'),
            percentage=Avg('percentage')
        ).order_by('-percentage')
        
        # Calculate rank
        rank = 1
        previous_percentage = None
        
        for i, grade_data in enumerate(student_grades):
            current_percentage = grade_data['percentage']
            
            if previous_percentage is not None and current_percentage < previous_percentage:
                rank = i + 1
            
            if grade_data['student_id'] == student.id:
                return rank, len(student_grades)
            
            previous_percentage = current_percentage
        
        return None, None
    
    @staticmethod
    def generate_report_card(student, academic_year, term=None, exam_type=None):
        """Generate comprehensive report card"""
        # Get student grades
        student_grades = StudentGrade.objects.filter(
            student=student,
            exam__academic_year=academic_year,
            is_approved=True
        )
        
        if term:
            student_grades = student_grades.filter(exam__class_obj__term=term)
        
        if exam_type:
            student_grades = student_grades.filter(exam__exam_type=exam_type)
        
        if not student_grades.exists():
            return None
        
        # Calculate totals
        total_marks = sum(grade.exam.total_marks for grade in student_grades)
        total_obtained = sum(grade.marks_obtained for grade in student_grades)
        overall_percentage = (total_obtained / total_marks) * 100 if total_marks > 0 else 0
        
        # Calculate overall grade
        grade_scale = GradeScale.objects.filter(
            academic_year=academic_year,
            is_default=True
        ).first()
        
        overall_grade = None
        overall_grade_points = None
        
        if grade_scale:
            grade_range = grade_scale.grade_ranges.filter(
                min_percentage__lte=overall_percentage,
                max_percentage__gte=overall_percentage
            ).first()
            
            if grade_range:
                overall_grade = grade_range.grade
                overall_grade_points = grade_range.grade_points
        
        # Calculate class rank
        class_obj = student_grades.first().exam.class_obj
        class_rank, total_students = GradeCalculationService.calculate_student_rank(
            student, exam_type, academic_year, class_obj
        )
        
        # Get attendance percentage
        from attendance.models import AttendanceSummary
        attendance_summary = AttendanceSummary.objects.filter(
            student=student,
            academic_year=academic_year
        ).aggregate(
            avg_attendance=Avg('attendance_percentage')
        )
        
        attendance_percentage = attendance_summary['avg_attendance'] or 0
        
        # Create report card
        report_card = ReportCard.objects.create(
            student=student,
            academic_year=academic_year,
            term=term,
            exam_type=exam_type,
            total_marks=total_marks,
            total_obtained=total_obtained,
            overall_percentage=overall_percentage,
            overall_grade=overall_grade,
            overall_grade_points=overall_grade_points,
            class_rank=class_rank,
            total_students=total_students,
            attendance_percentage=attendance_percentage
        )
        
        # Add subject grades
        for grade in student_grades:
            ReportCardSubjectGrade.objects.create(
                report_card=report_card,
                subject=grade.exam.subject,
                marks_obtained=grade.marks_obtained,
                total_marks=grade.exam.total_marks,
                percentage=grade.percentage,
                grade=grade.grade,
                grade_points=grade.grade_points,
                remarks=grade.remarks
            )
        
        return report_card
    
    @staticmethod
    def bulk_grade_approval(exam_ids, approved_by):
        """Bulk approve grades for exams"""
        grades = StudentGrade.objects.filter(
            exam_id__in=exam_ids,
            is_approved=False
        )
        
        updated_count = grades.update(
            is_approved=True,
            approved_by=approved_by,
            approved_at=timezone.now()
        )
        
        return updated_count
```

### 7.4 Django Admin Integration

#### 7.4.1 Admin Configuration
```python
# apps/examination/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg, Count, Sum
from .models import Exam, StudentGrade, ReportCard, GradeScale

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['name', 'class_obj', 'subject', 'exam_type', 'date', 'completion_status', 'grade_statistics']
    list_filter = ['exam_type', 'academic_year', 'class_obj', 'subject', 'date']
    search_fields = ['name', 'class_obj__name', 'subject__name']
    date_hierarchy = 'date'
    raw_id_fields = ['created_by']
    
    def completion_status(self, obj):
        if obj.is_completed:
            return format_html('<span style="color: green;">✓ Completed</span>')
        else:
            return format_html('<span style="color: orange;">⏳ Pending</span>')
    completion_status.short_description = 'Status'
    
    def grade_statistics(self, obj):
        grades = obj.student_grades.all()
        if not grades.exists():
            return 'No grades'
        
        avg_percentage = grades.aggregate(avg=Avg('percentage'))['avg'] or 0
        passed = grades.filter(marks_obtained__gte=obj.passing_marks).count()
        total = grades.count()
        
        return format_html(
            'Avg: {:.1f}% | Pass: {}/{}',
            avg_percentage, passed, total
        )
    grade_statistics.short_description = 'Statistics'

class StudentGradeInline(admin.TabularInline):
    model = StudentGrade
    extra = 0
    raw_id_fields = ['student']

@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ['student', 'academic_year', 'overall_percentage', 'overall_grade', 'class_rank', 'is_published']
    list_filter = ['academic_year', 'is_published', 'overall_grade']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    raw_id_fields = ['student']
    
    actions = ['bulk_publish']
    
    def bulk_publish(self, request, queryset):
        count = queryset.filter(is_published=False).update(
            is_published=True,
            published_at=timezone.now()
        )
        self.message_user(request, f'{count} report cards published successfully.')
    bulk_publish.short_description = 'Publish selected report cards'
```

### 7.5 API Endpoints (Django REST Framework)

#### 7.5.1 Examination API
```
GET    /api/examination/exams/                 # List exams
POST   /api/examination/exams/                 # Create exam
GET    /api/examination/exams/{id}/            # Exam details
PUT    /api/examination/exams/{id}/            # Update exam
DELETE /api/examination/exams/{id}/            # Delete exam
GET    /api/examination/exams/{id}/grades/      # Exam grades
POST   /api/examination/exams/{id}/bulk-grade/  # Bulk grade entry

GET    /api/examination/exam-types/             # List exam types
POST   /api/examination/exam-types/             # Create exam type

GET    /api/examination/schedules/              # List exam schedules
POST   /api/examination/schedules/              # Create exam schedule
```

#### 7.5.2 Grades API
```
GET    /api/examination/grades/                 # List grades
POST   /api/examination/grades/                 # Create/Update grade
GET    /api/examination/grades/{id}/            # Grade details
PUT    /api/examination/grades/{id}/            # Update grade
POST   /api/examination/grades/bulk-approve/    # Bulk approve grades
GET    /api/examination/grades/student/{id}/    # Student's grades
GET    /api/examination/grades/class/{id}/      # Class grades

GET    /api/examination/grade-scales/           # List grade scales
POST   /api/examination/grade-scales/           # Create grade scale
GET    /api/examination/grade-ranges/           # List grade ranges
```

#### 7.5.3 Report Cards API
```
GET    /api/examination/report-cards/           # List report cards
POST   /api/examination/report-cards/           # Generate report card
GET    /api/examination/report-cards/{id}/      # Report card details
PUT    /api/examination/report-cards/{id}/      # Update report card
POST   /api/examination/report-cards/{id}/publish/ # Publish report card
GET    /api/examination/report-cards/{id}/pdf/     # Download PDF
POST   /api/examination/report-cards/bulk-generate/ # Bulk generate
```

### 7.6 Views and Serializers

#### 7.6.1 API Views
```python
# apps/examination/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone
from .models import Exam, StudentGrade, ReportCard
from .serializers import ExamSerializer, StudentGradeSerializer, ReportCardSerializer
from .services import GradeCalculationService

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Role-based filtering
        if user.role == 'TEACHER':
            queryset = queryset.filter(
                Q(created_by=user.teacher_profile) |
                Q(subject__in=user.teacher_profile.subjects.all())
            ).distinct()
        elif user.role == 'STUDENT':
            queryset = queryset.filter(
                class_obj=user.student_profile.current_class
            )
        elif user.role == 'PARENT':
            # Parents can see exams for their children
            student_classes = user.parent_profile.children.values_list('current_class', flat=True)
            queryset = queryset.filter(class_obj__in=student_classes)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def bulk_grade_entry(self, request, pk=None):
        """Bulk grade entry for exam"""
        exam = self.get_object()
        grades_data = request.data.get('grades', [])
        
        try:
            grades_created = 0
            for grade_data in grades_data:
                student_id = grade_data.get('student_id')
                marks_obtained = grade_data.get('marks_obtained')
                remarks = grade_data.get('remarks', '')
                
                grade, created = StudentGrade.objects.update_or_create(
                    exam=exam,
                    student_id=student_id,
                    defaults={
                        'marks_obtained': marks_obtained,
                        'remarks': remarks,
                        'entered_by': request.user.teacher_profile,
                    }
                )
                if created:
                    grades_created += 1
            
            return Response({
                'message': f'{grades_created} grades entered successfully'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ReportCardViewSet(viewsets.ModelViewSet):
    queryset = ReportCard.objects.all()
    serializer_class = ReportCardSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate report card for student"""
        try:
            student_id = request.data.get('student_id')
            academic_year_id = request.data.get('academic_year_id')
            term_id = request.data.get('term_id', None)
            exam_type_id = request.data.get('exam_type_id', None)
            
            from students.models import Student
            from academic.models import AcademicYear, Term, ExamType
            
            student = Student.objects.get(id=student_id)
            academic_year = AcademicYear.objects.get(id=academic_year_id)
            term = Term.objects.filter(id=term_id).first() if term_id else None
            exam_type = ExamType.objects.filter(id=exam_type_id).first() if exam_type_id else None
            
            report_card = GradeCalculationService.generate_report_card(
                student, academic_year, term, exam_type
            )
            
            if report_card:
                return Response({
                    'message': 'Report card generated successfully',
                    'report_card_id': report_card.id
                })
            else:
                return Response(
                    {'error': 'No approved grades found for this student'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )