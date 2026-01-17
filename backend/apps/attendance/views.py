from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q, Avg
from datetime import datetime
from .models import Attendance, AttendanceSummary
from .serializers import AttendanceSerializer, AttendanceSummarySerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student').all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'date', 'type']
    search_fields = ['student__first_name', 'student__last_name', 'notes']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']

    @action(detail=False, methods=['get'])
    def by_date(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({'error': 'date parameter is required (YYYY-MM-DD)'}, status=400)
        try:
            attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
            records = self.queryset.filter(date=attendance_date)
            serializer = self.get_serializer(records, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

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

class AttendanceSummaryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSummary.objects.select_related('student').all()
    serializer_class = AttendanceSummarySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'month', 'year']
