from rest_framework import serializers
from .models import BehaviorRecord

class BehaviorRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    behavior_type_display = serializers.CharField(source='get_behavior_type_display', read_only=True)

    class Meta:
        model = BehaviorRecord
        fields = [
            'id', 'student', 'student_name', 'reported_by', 'reported_by_name',
            'behavior_type', 'behavior_type_display', 'title', 'description',
            'date', 'severity', 'points', 'action_taken', 'is_resolved',
            'resolved_by', 'resolved_by_name', 'resolved_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'resolved_at']
