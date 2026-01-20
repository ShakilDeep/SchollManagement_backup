from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Vehicle, TransportAllocation
from .serializers import VehicleSerializer, TransportAllocationSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'vehicle_type']
    search_fields = ['vehicle_number', 'driver_name', 'driver_phone', 'route']
    ordering_fields = ['vehicle_number', 'created_at']
    ordering = ['vehicle_number']

class TransportAllocationViewSet(viewsets.ModelViewSet):
    queryset = TransportAllocation.objects.select_related('student', 'vehicle').all()
    serializer_class = TransportAllocationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'vehicle', 'status', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name', 'pickup_point', 'drop_point']
    ordering_fields = ['created_at', 'fees']
    ordering = ['-created_at']
