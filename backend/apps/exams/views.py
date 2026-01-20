from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Avg
from .models import Exam, Result
from .serializers import ExamSerializer, ResultSerializer, ResultCreateSerializer

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.select_related('academic_year', 'grade').all()
    serializer_class = ExamSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'grade', 'exam_type']
    search_fields = ['name']
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        exam = self.get_object()
        results = Result.objects.filter(exam=exam).select_related('student')
        serializer = ResultSerializer(results, many=True)
        return Response(serializer.data)

class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.select_related('student', 'exam').all()
    serializer_class = ResultSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'exam', 'subject']
    search_fields = ['student__first_name', 'student__last_name', 'subject']
    ordering_fields = ['marks_obtained']
    ordering = ['-marks_obtained']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ResultCreateSerializer
        return ResultSerializer

    @action(detail=False, methods=['get'])
    def student_summary(self, request):
        student_id = request.query_params.get('student_id')
        exam_id = request.query_params.get('exam_id')

        if not student_id:
            return Response({'error': 'student_id parameter is required'}, status=400)

        queryset = self.queryset.filter(student_id=student_id)
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)

        serializer = self.get_serializer(queryset, many=True)
        
        summary = queryset.aggregate(
            total_obtained=Sum('marks_obtained'),
            total_possible=Sum('total_marks'),
            average=Avg('marks_obtained')
        )

        return Response({
            'results': serializer.data,
            'summary': summary
        })
