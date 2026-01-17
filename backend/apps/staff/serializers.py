from rest_framework import serializers
from .models import Staff

class StaffSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'user_id', 'full_name', 'email', 'phone', 'date_of_birth',
            'gender', 'blood_group', 'address', 'city', 'state', 'zip_code',
            'join_date', 'type', 'type_display', 'designation', 'department',
            'salary', 'qualification', 'experience', 'subjects', 'assigned_grades',
            'assigned_sections', 'photo', 'documents', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
