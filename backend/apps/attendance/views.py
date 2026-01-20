from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q, Avg, Prefetch
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Attendance, AttendanceSummary
from .serializers import AttendanceSerializer, AttendanceSummarySerializer
from apps.students.models import Student

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student').all()
    serializer_class = AttendanceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'date', 'type']
    search_fields = ['student__first_name', 'student__last_name', 'notes']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']

    @action(detail=False, methods=['get'])
    def by_date(self, request):
        date = request.query_params.get('date')
        grade_id = request.query_params.get('grade_id')
        section_id = request.query_params.get('section_id')
        search = request.query_params.get('search')
        
        if not date:
            return Response({'error': 'date parameter is required (YYYY-MM-DD)'}, status=400)
        
        try:
            attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
        students_queryset = Student.objects.filter(status='Active')
        
        if grade_id:
            students_queryset = students_queryset.filter(grade_id=grade_id)
        
        if section_id:
            students_queryset = students_queryset.filter(section_id=section_id)
        
        if search:
            students_queryset = students_queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(roll_number__icontains=search)
            )
        
        prefetch_attendance = Prefetch(
            'attendance_set',
            queryset=Attendance.objects.filter(date=attendance_date),
            to_attr='attendance_for_date'
        )
        
        students = students_queryset.prefetch_related(prefetch_attendance).select_related(
            'grade', 'section'
        ).order_by('roll_number')
        
        result = []
        for student in students:
            attendance = getattr(student, 'attendance_for_date', [None])[0] if student.attendance_for_date else None
            
            result.append({
                'id': str(student.id),
                'rollNumber': student.roll_number,
                'name': f'{student.first_name} {student.last_name}',
                'grade': student.grade.name,
                'section': student.section.name,
                'status': attendance.type if attendance else 'Unmarked',
                'checkIn': None,
                'checkOut': None,
                'avatar': student.photo.url if student.photo else None,
                'email': student.email,
                'phone': student.phone
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        student_id = request.query_params.get('student_id')

        if not all([month, year]):
            return Response({'error': 'month and year parameters are required'}, status=400)

        queryset = AttendanceSummary.objects.filter(month=month, year=year)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        serializer = AttendanceSummarySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def student_report(self, request):
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({'error': 'student_id parameter is required'}, status=400)

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = self.queryset.filter(student_id=student_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        serializer = self.get_serializer(queryset, many=True)
        
        summary = queryset.values('type').annotate(count=Count('type'))
        
        return Response({
            'attendance': serializer.data,
            'summary': list(summary)
        })

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        date = request.data.get('date')
        attendance_data = request.data.get('attendance_data', [])
        
        if not date:
            return Response({'error': 'date parameter is required'}, status=400)
        
        if not attendance_data:
            return Response({'error': 'attendance_data parameter is required'}, status=400)
        
        try:
            attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
        created_records = []
        updated_records = []
        
        for item in attendance_data:
            student_id = item.get('id')
            status = item.get('status')
            
            if not student_id or not status:
                continue
            
            if status == 'Unmarked':
                deleted, _ = Attendance.objects.filter(
                    student_id=student_id, 
                    date=attendance_date
                ).delete()
                if deleted > 0:
                    updated_records.append(student_id)
            else:
                attendance, created = Attendance.objects.update_or_create(
                    student_id=student_id,
                    date=attendance_date,
                    defaults={
                        'type': status,
                        'marked_by': str(request.user.id)
                    }
                )
                if created:
                    created_records.append(student_id)
                else:
                    updated_records.append(student_id)
        
        return Response({
            'success': True,
            'created': len(created_records),
            'updated': len(updated_records),
            'message': f'Created {len(created_records)} and updated {len(updated_records)} attendance records'
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        date_str = request.query_params.get('date')
        
        if not date_str:
            return Response({'error': 'date parameter is required (YYYY-MM-DD)'}, status=400)
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        
        today_end = date + timedelta(days=1)
        seven_days_ago = date - timedelta(days=6)
        
        total_students = Student.objects.filter(status='Active').count()
        
        all_attendance_records = Attendance.objects.filter(
            date__gte=seven_days_ago,
            date__lt=today_end
        )
        
        attendance_by_date = {}
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            date_key = d.isoformat()
            attendance_by_date[date_key] = {
                'Present': 0,
                'Absent': 0,
                'Late': 0,
                'HalfDay': 0
            }
        
        for record in all_attendance_records:
            date_key = record.date.isoformat()
            if date_key in attendance_by_date:
                status = record.type if record.type in attendance_by_date[date_key] else 'Absent'
                attendance_by_date[date_key][status] += 1
        
        trend_data = []
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            date_key = d.isoformat()
            stats = attendance_by_date.get(date_key, {
                'Present': 0,
                'Absent': 0,
                'Late': 0,
                'HalfDay': 0
            })
            
            effective_present = stats['Present'] + stats['Late'] + stats['HalfDay']
            rate = (effective_present / total_students * 100) if total_students > 0 else 0
            
            trend_data.append({
                'date': d,
                'present': stats['Present'],
                'absent': stats['Absent'],
                'late': stats['Late'],
                'halfDay': stats['HalfDay'],
                'rate': round(rate * 10) / 10
            })
        
        return Response({
            'trends': trend_data
        })

class AttendanceSummaryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSummary.objects.select_related('student__user', 'student__grade', 'student__section').all()
    serializer_class = AttendanceSummarySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'month', 'year']
