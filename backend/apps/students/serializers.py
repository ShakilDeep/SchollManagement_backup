from rest_framework import serializers
from .models import AcademicYear, Grade, Section, Parent, Student

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current']

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'name', 'numeric_value', 'order', 'description']

class SectionSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'name', 'grade', 'grade_name', 'room_number', 'capacity', 'current_strength']

class ParentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Parent
        fields = ['id', 'user', 'user_email', 'first_name', 'last_name', 'phone', 'email', 'address', 'occupation']

class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'full_name', 'roll_number', 'admission_number', 'admission_date',
            'first_name', 'last_name', 'gender', 'date_of_birth', 'blood_group', 'religion',
            'nationality', 'mother_tongue', 'phone', 'email', 'emergency_contact',
            'emergency_phone', 'address', 'city', 'state', 'zip_code', 'grade', 'grade_name',
            'section', 'section_name', 'academic_year', 'academic_year_name', 'guardian',
            'guardian_name', 'relationship', 'house', 'allergies', 'medical_conditions',
            'special_needs', 'status', 'photo', 'documents', 'created_at', 'updated_at',
            'user_email'
        ]
        read_only_fields = ['id', 'admission_date', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class StudentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'roll_number', 'admission_number', 'first_name', 'last_name',
            'gender', 'date_of_birth', 'blood_group', 'religion', 'nationality',
            'mother_tongue', 'phone', 'email', 'emergency_contact', 'emergency_phone',
            'address', 'city', 'state', 'zip_code', 'grade', 'section', 'academic_year',
            'guardian', 'relationship', 'house', 'allergies', 'medical_conditions',
            'special_needs', 'status'
        ]

    def create(self, validated_data):
        user = validated_data.pop('user')
        student = Student.objects.create(user=user, **validated_data)
        return student
