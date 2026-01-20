from django.db import models
from apps.students.models import Grade, Section
from apps.users.models import User
import uuid

class StaffType(models.TextChoices):
    TEACHING = 'TEACHING', 'Teaching'
    NON_TEACHING = 'NON_TEACHING', 'Non-Teaching'
    ADMIN = 'ADMIN', 'Administrative'
    SUPPORT = 'SUPPORT', 'Support'

class Staff(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='staff_profile', null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    join_date = models.DateField()
    type = models.CharField(max_length=20, choices=StaffType.choices, default=StaffType.TEACHING)
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    qualification = models.TextField()
    experience = models.IntegerField(default=0)
    subjects = models.JSONField(blank=True, null=True)
    assigned_grades = models.ManyToManyField(Grade, blank=True)
    assigned_sections = models.ManyToManyField(Section, blank=True)
    photo = models.ImageField(upload_to='staff/photos/', blank=True, null=True)
    documents = models.JSONField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['department']),
            models.Index(fields=['is_active']),
            models.Index(fields=['email']),
            models.Index(fields=['join_date']),
            models.Index(fields=['type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.designation}"
