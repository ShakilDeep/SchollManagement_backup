from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Hostel, Room, HostelAllocation
from .serializers import HostelSerializer, RoomSerializer, HostelAllocationSerializer

class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'code', 'location', 'warden_name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('hostel').all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['hostel', 'floor']
    search_fields = ['room_number']
    ordering_fields = ['room_number', 'floor']
    ordering = ['hostel', 'room_number']

class HostelAllocationViewSet(viewsets.ModelViewSet):
    queryset = HostelAllocation.objects.select_related('student', 'room', 'room__hostel').all()
    serializer_class = HostelAllocationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'room', 'status', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name']
    ordering_fields = ['allocated_from', 'created_at']
    ordering = ['-allocated_from']
