from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import BehaviorRecord
from .serializers import BehaviorRecordSerializer

class BehaviorRecordViewSet(viewsets.ModelViewSet):
    queryset = BehaviorRecord.objects.select_related('student', 'reported_by', 'resolved_by').all()
    serializer_class = BehaviorRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'behavior_type', 'severity', 'is_resolved']
    search_fields = ['student__first_name', 'student__last_name', 'title', 'description']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        behavior = self.get_object()
        if behavior.is_resolved:
            return Response({'error': 'Behavior record already resolved'}, status=status.HTTP_400_BAD_REQUEST)

        action_taken = request.data.get('action_taken')
        if not action_taken:
            return Response({'error': 'action_taken is required'}, status=status.HTTP_400_BAD_REQUEST)

        behavior.action_taken = action_taken
        behavior.is_resolved = True
        behavior.resolved_by = request.user
        behavior.resolved_at = timezone.now()
        behavior.save()

        return Response({'message': 'Behavior record resolved successfully'})
