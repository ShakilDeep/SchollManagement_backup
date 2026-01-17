from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Subject, Curriculum
from .serializers import SubjectSerializer, CurriculumSerializer

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'code', 'description']
    ordering = ['name']

class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = Curriculum.objects.select_related('grade', 'subject').all()
    serializer_class = CurriculumSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['grade', 'subject']
