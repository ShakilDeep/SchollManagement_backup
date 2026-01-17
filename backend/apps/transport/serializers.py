from rest_framework import serializers
from .models import Vehicle, TransportAllocation

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            'id', 'vehicle_number', 'vehicle_type', 'capacity', 'driver_name',
            'driver_phone', 'driver_license', 'route', 'fuel_type',
            'insurance_expiry', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class TransportAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)

    class Meta:
        model = TransportAllocation
        fields = [
            'id', 'student', 'student_name', 'vehicle', 'vehicle_number',
            'pickup_point', 'pickup_time', 'drop_point', 'drop_time',
            'fees', 'academic_year', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
