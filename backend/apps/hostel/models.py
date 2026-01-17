from django.db import models
from apps.students.models import Student
import uuid

class Hostel(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    location = models.CharField(max_length=200)
    capacity = models.IntegerField()
    warden_name = models.CharField(max_length=100)
    warden_phone = models.CharField(max_length=20)
    facilities = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.name

class Room(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=20)
    floor = models.IntegerField()
    capacity = models.IntegerField(default=4)
    current_occupancy = models.IntegerField(default=0)
    facilities = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ['hostel', 'room_number']
        indexes = [
            models.Index(fields=['hostel']),
        ]

    def __str__(self):
        return f"{self.hostel.name} - Room {self.room_number}"

class HostelAllocation(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    allocated_from = models.DateField()
    allocated_until = models.DateField(blank=True, null=True)
    fees = models.DecimalField(max_digits=10, decimal_places=2)
    academic_year = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'academic_year']
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['room']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.room}"
