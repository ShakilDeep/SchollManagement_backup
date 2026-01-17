from rest_framework import serializers
from .models import Exam, Result

class ExamSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'exam_type', 'academic_year', 'academic_year_name',
            'grade', 'grade_name', 'start_date', 'end_date', 'total_marks',
            'passing_marks', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'student', 'student_name', 'exam', 'exam_name',
            'subject', 'marks_obtained', 'total_marks', 'grade',
            'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ResultCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = [
            'student', 'exam', 'subject', 'marks_obtained',
            'total_marks', 'grade', 'remarks'
        ]
