from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Message, MessageRecipient
from .serializers import MessageSerializer, MessageCreateSerializer

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related('sender').prefetch_related('recipients').all()
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
        return self.queryset

    @action(detail=False, methods=['get'])
    def inbox(self, request):
        messages = Message.objects.all().select_related('sender').prefetch_related('recipients').distinct()
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sent(self, request):
        messages = Message.objects.all().select_related('sender').prefetch_related('recipients')
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        message.recipients.all().update(is_read=True, read_at=timezone.now())
        return Response({'message': 'Marked as read'})

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        message = self.get_object()
        message.recipients.all().update(is_read=False, read_at=None)
        return Response({'message': 'Marked as unread'})
