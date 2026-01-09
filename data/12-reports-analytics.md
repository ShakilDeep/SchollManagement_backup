# Reports & Analytics Module

## 4.10 Library Management Module (Optional Enhancement)

### Django Models Implementation

```python
# library/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from schools.models import School, AcademicYear

User = get_user_model()

class Book(models.Model):
    """Book catalog management"""
    
    GENRE_CHOICES = [
        ('fiction', 'Fiction'),
        ('non_fiction', 'Non-Fiction'),
        ('reference', 'Reference'),
        ('textbook', 'Textbook'),
        ('magazine', 'Magazine'),
        ('journal', 'Journal'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('borrowed', 'Borrowed'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Under Maintenance'),
        ('lost', 'Lost'),
        ('damaged', 'Damaged'),
    ]
    
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='books')
    
    # Book details
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=True)
    publisher = models.CharField(max_length=100, blank=True)
    publication_year = models.PositiveIntegerField(null=True, blank=True)
    genre = models.CharField(max_length=20, choices=GENRE_CHOICES, default='other')
    
    # Physical details
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    
    # Classification
    dewey_decimal = models.CharField(max_length=20, blank=True)
    subject_keywords = models.CharField(max_length=200, blank=True)
    
    # Status and location
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    location = models.CharField(max_length=50, blank=True)  # Shelf/section info
    
    # Metadata
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'library_books'
        ordering = ['title', 'author']
        indexes = [
            models.Index(fields=['school', 'status']),
            models.Index(fields=['isbn']),
            models.Index(fields=['title', 'author']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.author}"
    
    @property
    def is_available(self):
        return self.available_copies > 0 and self.status == 'available'

class BookIssue(models.Model):
    """Book issue/return tracking"""
    
    id = models.AutoField(primary_key=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='issues')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='book_issues')
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='issued_books')
    
    # Issue details
    issue_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    return_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('issued', 'Issued'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
        ('lost', 'Lost'),
    ], default='issued')
    
    # Fine calculation
    fine_per_day = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    total_fine = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    fine_paid = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    
    # Notes
    issue_notes = models.TextField(blank=True)
    return_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'library_book_issues'
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['book', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['issue_date']),
        ]
    
    def __str__(self):
        return f"{self.book.title} - {self.student.get_full_name()}"
    
    @property
    def is_overdue(self):
        return self.status == 'issued' and timezone.now() > self.due_date
    
    @property
    def days_overdue(self):
        if self.is_overdue:
            return (timezone.now() - self.due_date).days
        return 0
    
    def calculate_fine(self):
        """Calculate fine for overdue book"""
        if self.is_overdue:
            days = self.days_overdue
            self.total_fine = days * self.fine_per_day
            self.save()
        return self.total_fine

class BookReservation(models.Model):
    """Book reservation system"""
    
    id = models.AutoField(primary_key=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reservations')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='book_reservations')
    
    # Reservation details
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('fulfilled', 'Fulfilled'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ], default='active')
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'library_book_reservations'
        ordering = ['-reserved_at']
        unique_together = ['book', 'student']
        indexes = [
            models.Index(fields=['book', 'status']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['expires_at']),
        ]
```

## 4.11 Reports & Analytics Module

### Django Models Implementation

```python
# reports/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from schools.models import School, AcademicYear, Class

User = get_user_model()

class ReportTemplate(models.Model):
    """Predefined report templates"""
    
    REPORT_TYPES = [
        ('student_list', 'Student List'),
        ('teacher_list', 'Teacher List'),
        ('attendance', 'Attendance Report'),
        ('academic_performance', 'Academic Performance'),
        ('fee_collection', 'Fee Collection Report'),
        ('exam_results', 'Exam Results Analysis'),
        ('class_comparison', 'Class-wise Comparison'),
        ('library', 'Library Report'),
        ('custom', 'Custom Report'),
    ]
    
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='report_templates')
    
    name = models.CharField(max_length=100)
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    description = models.TextField(blank=True)
    
    # Template configuration
    filters = models.JSONField(default=dict, help_text="Available filters for this report")
    columns = models.JSONField(default=list, help_text="Column configuration")
    group_by = models.JSONField(default=list, help_text="Grouping options")
    
    # Default parameters
    default_date_range = models.CharField(max_length=20, default='this_month')
    default_filters = models.JSONField(default=dict)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'reports_templates'
        ordering = ['report_type', 'name']
        indexes = [
            models.Index(fields=['school', 'report_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.school.name}"

class GeneratedReport(models.Model):
    """Generated reports with caching"""
    
    EXPORT_FORMATS = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
        ('json', 'JSON'),
    ]
    
    id = models.AutoField(primary_key=True)
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='generated_reports')
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Report data
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Generation parameters
    filters_applied = models.JSONField(default=dict)
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    
    # Results
    total_records = models.PositiveIntegerField(default=0)
    data_summary = models.JSONField(default=dict)
    
    # File handling
    export_format = models.CharField(max_length=10, choices=EXPORT_FORMATS, default='pdf')
    file_path = models.FileField(upload_to='reports/', null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    
    # Status and metadata
    status = models.CharField(max_length=20, choices=[
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ], default='generating')
    
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'reports_generated'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['template', 'generated_at']),
            models.Index(fields=['generated_by', 'generated_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.generated_at.strftime('%Y-%m-%d')}"

class AnalyticsMetric(models.Model):
    """Predefined analytics metrics"""
    
    METRIC_TYPES = [
        ('count', 'Count'),
        ('sum', 'Sum'),
        ('average', 'Average'),
        ('percentage', 'Percentage'),
        ('trend', 'Trend'),
        ('comparison', 'Comparison'),
    ]
    
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='analytics_metrics')
    
    name = models.CharField(max_length=100)
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    description = models.TextField(blank=True)
    
    # Configuration
    data_source = models.CharField(max_length=100, help_text="Model or query source")
    field_name = models.CharField(max_length=100, blank=True)
    filters = models.JSONField(default=dict)
    
    # Display configuration
    unit = models.CharField(max_length=20, blank=True)
    decimal_places = models.PositiveIntegerField(default=0)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=20, blank=True)
    
    # Dashboard positioning
    dashboard_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'analytics_metrics'
        ordering = ['dashboard_order', 'name']
        indexes = [
            models.Index(fields=['school', 'is_active']),
            models.Index(fields=['dashboard_order']),
        ]

class DashboardWidget(models.Model):
    """Dashboard widgets for analytics"""
    
    WIDGET_TYPES = [
        ('metric', 'Single Metric'),
        ('chart', 'Chart'),
        ('table', 'Table'),
        ('list', 'List'),
        ('calendar', 'Calendar'),
    ]
    
    CHART_TYPES = [
        ('line', 'Line Chart'),
        ('bar', 'Bar Chart'),
        ('pie', 'Pie Chart'),
        ('doughnut', 'Doughnut Chart'),
        ('area', 'Area Chart'),
    ]
    
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='dashboard_widgets')
    
    title = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPES)
    chart_type = models.CharField(max_length=20, choices=CHART_TYPES, blank=True)
    
    # Data configuration
    metrics = models.ManyToManyField(AnalyticsMetric, related_name='widgets')
    data_source = models.CharField(max_length=100, blank=True)
    query_config = models.JSONField(default=dict)
    
    # Display settings
    width = models.PositiveIntegerField(default=4)  # Bootstrap grid columns
    height = models.PositiveIntegerField(default=300)
    refresh_interval = models.PositiveIntegerField(default=300)  # seconds
    
    # Positioning
    dashboard_order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    
    # Access control
    user_roles = models.JSONField(default=list, help_text="Roles that can see this widget")
    
    class Meta:
        db_table = 'dashboard_widgets'
        ordering = ['dashboard_order', 'title']
        indexes = [
            models.Index(fields=['school', 'dashboard_order']),
            models.Index(fields=['is_visible']),
        ]
```

### Django Services

```python
# reports/services.py
from django.db import connection
from django.db.models import Count, Sum, Avg, Q, F, ExpressionWrapper, DurationField
from django.utils import timezone
from django.core.cache import cache
from django.http import HttpResponse
import pandas as pd
from io import BytesIO
import openpyxl
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from .models import ReportTemplate, GeneratedReport, AnalyticsMetric, DashboardWidget
from users.models import User
from attendance.models import Attendance
from academics.models Grade, Exam
from fees.models import StudentFee, FeePayment
from schools.models import Class, School

class ReportService:
    """Service for generating reports and analytics"""
    
    @staticmethod
    def generate_student_list_report(school, filters=None):
        """Generate student list report"""
        queryset = User.objects.filter(
            school=school,
            role='student',
            is_active=True
        )
        
        if filters:
            if 'class_id' in filters:
                queryset = queryset.filter(student_profile__current_class_id=filters['class_id'])
            if 'academic_year' in filters:
                queryset = queryset.filter(student_profile__academic_year_id=filters['academic_year'])
        
        data = []
        for student in queryset:
            data.append({
                'Admission Number': student.student_profile.admission_number,
                'Name': student.get_full_name(),
                'Class': str(student.student_profile.current_class) if student.student_profile.current_class else 'N/A',
                'Section': student.student_profile.section or '',
                'Date of Birth': student.date_of_birth,
                'Gender': student.gender,
                'Phone': student.phone_number,
                'Email': student.email,
                'Address': student.address,
            })
        
        return pd.DataFrame(data)
    
    @staticmethod
    def generate_attendance_report(school, date_from, date_to, filters=None):
        """Generate attendance report"""
        attendances = Attendance.objects.filter(
            student__school=school,
            date__range=[date_from, date_to]
        )
        
        if filters:
            if 'class_id' in filters:
                attendances = attendances.filter(student__student_profile__current_class_id=filters['class_id'])
            if 'status' in filters:
                attendances = attendances.filter(status=filters['status'])
        
        # Group by student and date
        data = []
        for attendance in attendances.select_related('student', 'student__student_profile'):
            data.append({
                'Date': attendance.date,
                'Admission Number': attendance.student.student_profile.admission_number,
                'Student Name': attendance.student.get_full_name(),
                'Class': str(attendance.student.student_profile.current_class),
                'Status': attendance.status,
                'Check In': attendance.check_in_time,
                'Check Out': attendance.check_out_time,
                'Remarks': attendance.remarks,
            })
        
        return pd.DataFrame(data)
    
    @staticmethod
    def generate_academic_performance_report(school, academic_year, filters=None):
        """Generate academic performance report"""
        grades = Grade.objects.filter(
            student__school=school,
            exam__academic_year=academic_year
        )
        
        if filters:
            if 'class_id' in filters:
                grades = grades.filter(student__student_profile__current_class_id=filters['class_id'])
            if 'exam_id' in filters:
                grades = grades.filter(exam_id=filters['exam_id'])
        
        data = []
        for grade in grades.select_related('student', 'subject', 'exam'):
            data.append({
                'Student Name': grade.student.get_full_name(),
                'Class': str(grade.student.student_profile.current_class),
                'Exam': grade.exam.name,
                'Subject': grade.subject.name,
                'Marks Obtained': grade.marks_obtained,
                'Maximum Marks': grade.maximum_marks,
                'Grade': grade.grade_obtained,
                'Percentage': grade.percentage,
            })
        
        return pd.DataFrame(data)
    
    @staticmethod
    def generate_fee_collection_report(school, date_from, date_to, filters=None):
        """Generate fee collection report"""
        payments = FeePayment.objects.filter(
            student_fee__student__school=school,
            payment_date__range=[date_from, date_to],
            payment_status='COMPLETED'
        )
        
        if filters:
            if 'class_id' in filters:
                payments = payments.filter(student_fee__student__student_profile__current_class_id=filters['class_id'])
            if 'payment_method' in filters:
                payments = payments.filter(payment_method=filters['payment_method'])
        
        data = []
        for payment in payments.select_related('student_fee', 'student_fee__student', 'collected_by'):
            data.append({
                'Payment Date': payment.payment_date.date(),
                'Receipt Number': payment.receipt_number,
                'Student Name': payment.student_fee.student.get_full_name(),
                'Class': str(payment.student_fee.student.student_profile.current_class),
                'Fee Category': payment.student_fee.fee_category.name,
                'Amount Paid': payment.amount,
                'Payment Method': payment.payment_method,
                'Transaction ID': payment.transaction_id,
                'Collected By': payment.collected_by.get_full_name() if payment.collected_by else 'N/A',
            })
        
        return pd.DataFrame(data)
    
    @staticmethod
    def export_to_excel(df, filename):
        """Export DataFrame to Excel"""
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Report', index=False)
            
            # Get the workbook and worksheet for formatting
            workbook = writer.book
            worksheet = writer.sheets['Report']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def export_to_pdf(df, title, filename):
        """Export DataFrame to PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        normal_style = styles['Normal']
        
        # Add title
        elements.append(Paragraph(title, title_style))
        elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}", normal_style))
        elements.append(Paragraph(" ", normal_style))
        
        # Convert DataFrame to table
        if not df.empty:
            # Prepare data for table
            table_data = [list(df.columns)]  # Header row
            for index, row in df.iterrows():
                table_data.append([str(cell) if pd.notna(cell) else '' for cell in row])
            
            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            elements.append(table)
        else:
            elements.append(Paragraph("No data available for the selected criteria.", normal_style))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

class AnalyticsService:
    """Service for analytics calculations"""
    
    @staticmethod
    def get_student_enrollment_trends(school, months=12):
        """Get student enrollment trends"""
        end_date = timezone.now().date()
        start_date = (end_date - timezone.timedelta(days=months*30))
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    strftime('%Y-%m', date_joined) as month,
                    COUNT(*) as count
                FROM users_user 
                WHERE school_id = %s 
                    AND role = 'student'
                    AND date_joined BETWEEN %s AND %s
                GROUP BY strftime('%Y-%m', date_joined)
                ORDER BY month
            """, [school.id, start_date, end_date])
            
            results = cursor.fetchall()
        
        return {
            'labels': [row[0] for row in results],
            'data': [row[1] for row in results]
        }
    
    @staticmethod
    def get_attendance_trends(school, days=30):
        """Get attendance trends"""
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days)
        
        attendances = Attendance.objects.filter(
            student__school=school,
            date__range=[start_date, end_date]
        )
        
        daily_stats = attendances.values('date').annotate(
            present=Count('id', filter=Q(status='present')),
            absent=Count('id', filter=Q(status='absent')),
            late=Count('id', filter=Q(status='late')),
            total=Count('id')
        ).order_by('date')
        
        return {
            'labels': [str(stat['date']) for stat in daily_stats],
            'present': [stat['present'] for stat in daily_stats],
            'absent': [stat['absent'] for stat in daily_stats],
            'late': [stat['late'] for stat in daily_stats],
        }
    
    @staticmethod
    def get_fee_collection_trends(school, months=6):
        """Get fee collection trends"""
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=months*30)
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    strftime('%Y-%m', payment_date) as month,
                    SUM(amount) as total,
                    COUNT(*) as count
                FROM fees_feepayment
                WHERE student_fee_id IN (
                    SELECT id FROM fees_studentfee 
                    WHERE student_id IN (
                        SELECT id FROM users_user 
                        WHERE school_id = %s
                    )
                )
                AND payment_date BETWEEN %s AND %s
                AND payment_status = 'COMPLETED'
                GROUP BY strftime('%Y-%m', payment_date)
                ORDER BY month
            """, [school.id, start_date, end_date])
            
            results = cursor.fetchall()
        
        return {
            'labels': [row[0] for row in results],
            'amounts': [float(row[1]) for row in results],
            'counts': [row[2] for row in results]
        }
    
    @staticmethod
    def get_class_performance_comparison(school, academic_year):
        """Get class-wise performance comparison"""
        grades = Grade.objects.filter(
            student__school=school,
            exam__academic_year=academic_year
        )
        
        class_stats = grades.values('student__student_profile__current_class__name').annotate(
            avg_percentage=Avg('percentage'),
            total_students=Count('student', distinct=True),
            total_grades=Count('id')
        ).order_by('-avg_percentage')
        
        return {
            'labels': [stat['student__student_profile__current_class__name'] for stat in class_stats],
            'averages': [round(stat['avg_percentage'], 2) for stat in class_stats],
            'student_counts': [stat['total_students'] for stat in class_stats],
        }
    
    @staticmethod
    def get_teacher_workload_analysis(school):
        """Get teacher workload analysis"""
        from academics.models import SubjectAssignment
        
        assignments = SubjectAssignment.objects.filter(
            teacher__school=school,
            academic_year__is_active=True
        )
        
        teacher_stats = assignments.values('teacher__get_full_name').annotate(
            subjects_count=Count('subject', distinct=True),
            classes_count=Count('class_section', distinct=True),
            total_periods=Count('id')
        ).order_by('-total_periods')
        
        return {
            'labels': [stat['teacher__get_full_name'] for stat in teacher_stats],
            'subjects': [stat['subjects_count'] for stat in teacher_stats],
            'classes': [stat['classes_count'] for stat in teacher_stats],
            'periods': [stat['total_periods'] for stat in teacher_stats],
        }
```

### Django REST Framework Views

```python
# reports/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse, FileResponse
import json

from .models import ReportTemplate, GeneratedReport, DashboardWidget
from .serializers import ReportTemplateSerializer, GeneratedReportSerializer, DashboardWidgetSerializer
from .services import ReportService, AnalyticsService

class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for report templates"""
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['report_type']
    
    def get_queryset(self):
        return ReportTemplate.objects.filter(
            school=self.request.user.school,
            is_active=True
        )

class GeneratedReportViewSet(viewsets.ModelViewSet):
    """ViewSet for generated reports"""
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template', 'export_format', 'status']
    
    def get_queryset(self):
        return GeneratedReport.objects.filter(
            generated_by=self.request.user
        ).order_by('-generated_at')
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download generated report file"""
        report = self.get_object()
        if report.file_path and report.status == 'completed':
            response = FileResponse(
                report.file_path.open('rb'),
                as_attachment=True,
                filename=f"{report.title}.{report.export_format}"
            )
            return response
        return Response(
            {'error': 'Report file not available'},
            status=status.HTTP_404_NOT_FOUND
        )

class ReportGenerationViewSet(viewsets.GenericViewSet):
    """ViewSet for generating reports"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new report"""
        report_type = request.data.get('report_type')
        filters = request.data.get('filters', {})
        export_format = request.data.get('format', 'excel')
        
        # Validate date range
        date_from = request.data.get('date_from')
        date_to = request.data.get('date_to')
        
        if date_from:
            date_from = timezone.datetime.strptime(date_from, '%Y-%m-%d').date()
        if date_to:
            date_to = timezone.datetime.strptime(date_to, '%Y-%m-%d').date()
        
        # Generate report based on type
        try:
            if report_type == 'student_list':
                df = ReportService.generate_student_list_report(request.user.school, filters)
                title = 'Student List Report'
            elif report_type == 'attendance':
                df = ReportService.generate_attendance_report(
                    request.user.school, date_from, date_to, filters
                )
                title = f'Attendance Report ({date_from} to {date_to})'
            elif report_type == 'academic_performance':
                academic_year_id = filters.get('academic_year')
                df = ReportService.generate_academic_performance_report(
                    request.user.school, academic_year_id, filters
                )
                title = 'Academic Performance Report'
            elif report_type == 'fee_collection':
                df = ReportService.generate_fee_collection_report(
                    request.user.school, date_from, date_to, filters
                )
                title = f'Fee Collection Report ({date_from} to {date_to})'
            else:
                return Response(
                    {'error': 'Invalid report type'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Export based on format
            if export_format == 'excel':
                file_content = ReportService.export_to_excel(df, title)
                filename = f"{title.replace(' ', '_')}.xlsx"
            elif export_format == 'csv':
                file_content = df.to_csv(index=False).encode('utf-8')
                filename = f"{title.replace(' ', '_')}.csv"
            elif export_format == 'pdf':
                file_content = ReportService.export_to_pdf(df, title, filename)
                filename = f"{title.replace(' ', '_')}.pdf"
            else:
                return Response(
                    {'error': 'Invalid export format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create response
            response = HttpResponse(file_content, content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AnalyticsViewSet(viewsets.GenericViewSet):
    """ViewSet for analytics data"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard analytics"""
        school = request.user.school
        
        # Get various analytics
        enrollment_trends = AnalyticsService.get_student_enrollment_trends(school)
        attendance_trends = AnalyticsService.get_attendance_trends(school)
        fee_trends = AnalyticsService.get_fee_collection_trends(school)
        
        # Get summary metrics
        total_students = User.objects.filter(school=school, role='student', is_active=True).count()
        total_teachers = User.objects.filter(school=school, role='teacher', is_active=True).count()
        
        # Get today's attendance
        today_attendance = Attendance.objects.filter(
            student__school=school,
            date=timezone.now().date()
        ).aggregate(
            present=Count('id', filter=Q(status='present')),
            total=Count('id')
        )
        
        # Get current month fee collection
        current_month = timezone.now().replace(day=1)
        fee_collection = FeePayment.objects.filter(
            student_fee__student__school=school,
            payment_date__gte=current_month,
            payment_status='COMPLETED'
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return Response({
            'summary': {
                'total_students': total_students,
                'total_teachers': total_teachers,
                'today_attendance': {
                    'present': today_attendance['present'] or 0,
                    'total': today_attendance['total'] or 0,
                    'percentage': round((today_attendance['present'] or 0) / max(today_attendance['total'] or 1, 1) * 100, 2)
                },
                'fee_collection': {
                    'amount': float(fee_collection['total'] or 0),
                    'count': fee_collection['count'] or 0
                }
            },
            'trends': {
                'enrollment': enrollment_trends,
                'attendance': attendance_trends,
                'fees': fee_trends
            }
        })
    
    @action(detail=False, methods=['get'])
    def class_performance(self, request):
        """Get class performance comparison"""
        academic_year = request.query_params.get('academic_year')
        data = AnalyticsService.get_class_performance_comparison(
            request.user.school, academic_year
        )
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def teacher_workload(self, request):
        """Get teacher workload analysis"""
        data = AnalyticsService.get_teacher_workload_analysis(request.user.school)
        return Response(data)
```

## API Endpoints

### Reports
```
GET    /api/reports/templates/
POST   /api/reports/templates/
GET    /api/reports/templates/{id}/
PUT    /api/reports/templates/{id}/
DELETE /api/reports/templates/{id}/

GET    /api/reports/generated/
POST   /api/reports/generated/
GET    /api/reports/generated/{id}/
GET    /api/reports/generated/{id}/download/

POST   /api/reports/generate/
GET    /api/analytics/dashboard/
GET    /api/analytics/class-performance/
GET    /api/analytics/teacher-workload/
```

### Library Management (Optional)
```
GET    /api/library/books/
POST   /api/library/books/
GET    /api/library/books/{id}/
PUT    /api/library/books/{id}/
DELETE /api/library/books/{id}/

GET    /api/library/issues/
POST   /api/library/issues/
GET    /api/library/issues/{id}/
PUT    /api/library/issues/{id}/return/

GET    /api/library/reservations/
POST   /api/library/reservations/
DELETE /api/library/reservations/{id}/
```

## Features Summary

### 4.10.1 Library Management Module
- ✅ Book catalog management with ISBN tracking
- ✅ Book issue/return tracking with due dates
- ✅ Student borrowing history with fine calculation
- ✅ Fine calculation for late returns (configurable rates)
- ✅ Advanced book search with filters
- ✅ Real-time availability status
- ✅ Book reservation system
- ✅ Multiple copy support per book

### 4.11.1 Standard Reports
- ✅ Student list report with customizable filters
- ✅ Teacher list report with workload metrics
- ✅ Attendance reports (daily, monthly, yearly)
- ✅ Academic performance reports with grade analysis
- ✅ Fee collection reports with payment tracking
- ✅ Exam result analysis with trends
- ✅ Class-wise performance comparison

### 4.11.2 Analytics Dashboard
- ✅ Student enrollment trends visualization
- ✅ Attendance trends with present/absent breakdown
- ✅ Performance analytics with class comparisons
- ✅ Fee collection trends and metrics
- ✅ Teacher workload analysis
- ✅ Real-time dashboard widgets
- ✅ Configurable metrics and charts

### 4.11.3 Export Options
- ✅ PDF export with formatting
- ✅ Excel/CSV export with auto-column sizing
- ✅ Print-friendly report layouts
- ✅ Scheduled report generation
- ✅ Report caching and expiration
- ✅ Download history tracking