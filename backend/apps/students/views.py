from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import AcademicYear, Grade, Section, Parent, Student
from .serializers import (
    AcademicYearSerializer, GradeSerializer, SectionSerializer,
    ParentSerializer, StudentSerializer, StudentCreateSerializer
)

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_current']
    search_fields = ['name']
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['numeric_value', 'order']
    ordering = ['numeric_value']

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['grade']
    search_fields = ['name']
    ordering_fields = ['name']

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['user']
    search_fields = ['first_name', 'last_name', 'phone', 'email']

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('user', 'grade', 'section', 'academic_year', 'guardian').all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['grade', 'section', 'academic_year', 'status']
    search_fields = ['first_name', 'last_name', 'roll_number', 'admission_number']
    ordering_fields = ['first_name', 'last_name', 'admission_date']
    ordering = ['first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        return StudentSerializer

    @action(detail=False, methods=['get'])
    def by_grade(self, request):
        grade_id = request.query_params.get('grade_id')
        if not grade_id:
            return Response({'error': 'grade_id parameter is required'}, status=400)
        students = self.queryset.filter(grade_id=grade_id)
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_section(self, request):
        section_id = request.query_params.get('section_id')
        if not section_id:
            return Response({'error': 'section_id parameter is required'}, status=400)
        students = self.queryset.filter(section_id=section_id)
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)
