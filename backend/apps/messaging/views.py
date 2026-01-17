from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Message, MessageRecipient
from .serializers import MessageSerializer, MessageCreateSerializer

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related('sender').prefetch_related('recipients').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['message_type', 'priority', 'is_broadcast']
    search_fields = ['subject', 'content']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return MessageCreateSerializer
        return MessageSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']:
            return self.queryset
        else:
            return self.queryset.filter(
                models.Q(sender=user) | models.Q(recipients__recipient=user)
            ).distinct()

    @action(detail=False, methods=['get'])
    def inbox(self, request):
        messages = Message.objects.filter(
            recipients__recipient=request.user
        ).select_related('sender').prefetch_related('recipients').distinct()
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sent(self, request):
        messages = Message.objects.filter(
            sender=request.user
        ).select_related('sender').prefetch_related('recipients')
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        try:
            recipient = MessageRecipient.objects.get(message=message, recipient=request.user)
            recipient.is_read = True
            recipient.read_at = timezone.now()
            recipient.save()
            return Response({'message': 'Marked as read'})
        except MessageRecipient.DoesNotExist:
            return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        message = self.get_object()
        try:
            recipient = MessageRecipient.objects.get(message=message, recipient=request.user)
            recipient.is_read = False
            recipient.read_at = None
            recipient.save()
            return Response({'message': 'Marked as unread'})
        except MessageRecipient.DoesNotExist:
            return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
