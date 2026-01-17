from django.db import models
from apps.students.models import Student
import uuid

class Vehicle(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    vehicle_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=50)
    capacity = models.IntegerField()
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=20)
    driver_license = models.CharField(max_length=50, blank=True, null=True)
    route = models.CharField(max_length=200, blank=True, null=True)
    fuel_type = models.CharField(max_length=20, blank=True, null=True)
    insurance_expiry = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['vehicle_number']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.vehicle_number} - {self.driver_name}"

class TransportAllocation(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    pickup_point = models.CharField(max_length=200)
    pickup_time = models.TimeField()
    drop_point = models.CharField(max_length=200)
    drop_time = models.TimeField()
    fees = models.DecimalField(max_digits=10, decimal_places=2)
    academic_year = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'academic_year']
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['vehicle']),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.vehicle.vehicle_number}"
