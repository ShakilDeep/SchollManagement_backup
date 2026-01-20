from datetime import timedelta

from django.db.models import Count, Q, Sum, Avg, F, DateTimeField
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.students.models import Student, AcademicYear, Grade
from apps.staff.models import Staff
from apps.attendance.models import Attendance, AttendanceSummary
from apps.exams.models import Exam
from apps.library.models import Book
from apps.transport.models import Vehicle
from apps.inventory.models import Item


@api_view(['GET'])
def dashboard_stats(request):
    current_year = timezone.now().year
    today = timezone.now().date()
    seven_days_ago = today - timedelta(days=7)
    thirty_days_later = today + timedelta(days=30)

    current_academic_year = AcademicYear.objects.filter(is_current=True).first()

    total_students = Student.objects.count()
    total_staff = Staff.objects.count()
    total_grades = Grade.objects.count()

    active_students = Student.objects.filter(
        status='Active'
    ).count() if hasattr(Student, 'status') else total_students

    present_today = Attendance.objects.filter(
        date=today,
        type='PRESENT'
    ).count()

    recent_enrollments = Student.objects.filter(
        created_at__gte=seven_days_ago
    ).count()

    upcoming_exams = Exam.objects.filter(
        start_date__gte=today,
        start_date__lte=thirty_days_later
    ).count()

    library_books_total = Book.objects.count()

    active_vehicles = Vehicle.objects.filter(
        status='ACTIVE'
    ).count()

    recent_activities = []
    
    new_students = Student.objects.filter(
        created_at__gte=seven_days_ago
    )[:5]
    for student in new_students:
        recent_activities.append({
            'id': f'student_{student.id}',
            'type': 'student',
            'title': f'New Student: {student.first_name} {student.last_name}',
            'description': f'Student enrolled in {student.grade.name if student.grade else "Unknown Grade"}',
            'time': student.created_at.strftime('%I:%M %p') if student.created_at else 'Just now',
            'status': 'success',
            'icon': 'Users'
        })
    
    recent_attendance = Attendance.objects.filter(
        date=today
    )[:5]
    for attendance in recent_attendance:
        recent_activities.append({
            'id': f'attendance_{attendance.id}',
            'type': 'attendance',
            'title': f'Attendance: {attendance.student.first_name} {attendance.student.last_name}',
            'description': f'Marked as {attendance.type}',
            'time': 'Today',
            'status': 'success' if attendance.type == 'PRESENT' else 'warning',
            'icon': 'ClipboardCheck'
        })
    
    recent_exams = Exam.objects.filter(
        created_at__gte=seven_days_ago
    )[:5]
    for exam in recent_exams:
        recent_activities.append({
            'id': f'exam_{exam.id}',
            'type': 'exam',
            'title': f'New Exam: {exam.title}',
            'description': f'Scheduled for {exam.start_date.strftime("%B %d, %Y") if exam.start_date else "TBD"}',
            'time': exam.created_at.strftime('%I:%M %p') if exam.created_at else 'Just now',
            'status': 'info',
            'icon': 'FileText'
        })
    
    recent_activities = recent_activities[:10]

    total_attendance_records = Attendance.objects.count()
    total_present_records = Attendance.objects.filter(type='PRESENT').count()
    attendance_rate = (
        (total_present_records / total_attendance_records * 100)
        if total_attendance_records > 0
        else 0
    )

    grade_distribution = list(
        Student.objects.values('grade__name').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
    )

    attendance_by_grade = list(
        Attendance.objects.filter(date=today).values(
            'student__grade__name'
        ).annotate(
            present=Count('id', filter=Q(type='PRESENT')),
            absent=Count('id', filter=Q(type='ABSENT')),
            late=Count('id', filter=Q(type='LATE'))
        )
    )

    daily_attendance_trend = list(
        Attendance.objects.filter(
            date__gte=seven_days_ago
        ).annotate(
            day=TruncDate('date')
        ).values('day').annotate(
            present=Count('id', filter=Q(type='PRESENT')),
            absent=Count('id', filter=Q(type='ABSENT')),
            total=Count('id')
        ).order_by('day')
    )

    gender_distribution = list(
        Student.objects.values('gender').annotate(
            count=Count('id')
        ).order_by('-count')
    )

    staff_by_role = list(
        Staff.objects.values('type').annotate(
            count=Count('id')
        ).order_by('-count')
    )

    inventory_summary = {
        'total_items': Item.objects.count(),
        'low_stock_items': Item.objects.filter(
            quantity__lte=F('minimum_quantity')
        ).count(),
        'total_value': Item.objects.aggregate(
            total=Sum(F('quantity') * F('unit_price'))
        )['total'] or 0
    }

    response_data = {
        'counts': {
            'total_students': total_students,
            'total_staff': total_staff,
            'total_grades': total_grades,
            'active_students': active_students,
            'present_today': present_today,
            'recent_enrollments': recent_enrollments,
            'upcoming_exams': upcoming_exams,
            'library_books_total': library_books_total,
            'active_vehicles': active_vehicles,
        },
        'attendance': {
            'rate': round(attendance_rate, 2),
            'distribution': attendance_by_grade,
            'daily_trend': daily_attendance_trend,
        },
        'analytics': {
            'grade_distribution': grade_distribution,
            'gender_distribution': gender_distribution,
            'staff_by_role': staff_by_role,
            'inventory_summary': inventory_summary,
        },
        'recent_activities': recent_activities,
        'current_academic_year': {
            'id': current_academic_year.id if current_academic_year else None,
            'name': current_academic_year.name if current_academic_year else None,
        } if current_academic_year else None,
    }

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
    })
