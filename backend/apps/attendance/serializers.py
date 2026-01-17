from rest_framework import serializers
from .models import Attendance, AttendanceSummary, AttendanceType

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'student_roll', 'date', 'type',
            'type_display', 'notes', 'marked_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class AttendanceSummarySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = AttendanceSummary
        fields = [
            'id', 'student', 'student_name', 'month', 'year',
            'present_days', 'absent_days', 'late_days', 'excused_days',
            'total_working_days', 'attendance_percentage'
        ]
        read_only_fields = ['id']
