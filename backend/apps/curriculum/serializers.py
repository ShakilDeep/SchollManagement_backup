from rest_framework import serializers
from .models import Subject, Curriculum

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'description', 'icon', 'color']

class CurriculumSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Curriculum
        fields = ['id', 'grade', 'grade_name', 'subject', 'subject_name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
