from rest_framework import serializers
from .models import Hostel, Room, HostelAllocation

class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'code', 'location', 'capacity', 'warden_name',
            'warden_phone', 'facilities', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    available_beds = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'hostel', 'hostel_name', 'room_number', 'floor',
            'capacity', 'current_occupancy', 'available_beds', 'facilities'
        ]
        read_only_fields = ['id']

    def get_available_beds(self, obj):
        return obj.capacity - obj.current_occupancy

class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    hostel_name = serializers.CharField(source='room.hostel.name', read_only=True)

    class Meta:
        model = HostelAllocation
        fields = [
            'id', 'student', 'student_name', 'room', 'room_number', 'hostel_name',
            'allocated_from', 'allocated_until', 'fees', 'academic_year', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
