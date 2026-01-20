from django.db import models
from apps.users.models import User
import uuid

class AcademicYear(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['is_current']),
        ]

    def __str__(self):
        return self.name

class Grade(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    numeric_value = models.IntegerField()
    order = models.IntegerField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Section(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=20, blank=True, null=True)
    capacity = models.IntegerField(default=40)
    current_strength = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.grade.name} - {self.name}"

class Parent(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    roll_number = models.CharField(max_length=20, unique=True)
    admission_number = models.CharField(max_length=20, unique=True)
    admission_date = models.DateField(auto_now_add=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10)
    date_of_birth = models.DateField()
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    religion = models.CharField(max_length=50, blank=True, null=True)
    nationality = models.CharField(max_length=50, default='Local')
    mother_tongue = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100)
    emergency_phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    guardian = models.ForeignKey(Parent, on_delete=models.CASCADE)
    relationship = models.CharField(max_length=50)
    house = models.CharField(max_length=50, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    special_needs = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    photo = models.ImageField(upload_to='students/photos/', blank=True, null=True)
    documents = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['roll_number']),
            models.Index(fields=['grade']),
            models.Index(fields=['academic_year']),
            models.Index(fields=['section']),
            models.Index(fields=['status']),
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['admission_date']),
            models.Index(fields=['date_of_birth']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.roll_number})"
