from django.db import models
from apps.students.models import Student
import uuid

class AttendanceType(models.TextChoices):
    PRESENT = 'PRESENT', 'Present'
    ABSENT = 'ABSENT', 'Absent'
    LATE = 'LATE', 'Late'
    EXCUSED = 'EXCUSED', 'Excused'
    HOLIDAY = 'HOLIDAY', 'Holiday'

class Attendance(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    type = models.CharField(max_length=20, choices=AttendanceType.choices, default=AttendanceType.PRESENT)
    notes = models.TextField(blank=True, null=True)
    marked_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'date']
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.student} - {self.date} - {self.type}"

class AttendanceSummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    late_days = models.IntegerField(default=0)
    excused_days = models.IntegerField(default=0)
    total_working_days = models.IntegerField(default=0)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ['student', 'month', 'year']
        indexes = [
            models.Index(fields=['student', 'month', 'year']),
            models.Index(fields=['year', 'month']),
        ]

    def __str__(self):
        return f"{self.student} - {self.month}/{self.year} - {self.attendance_percentage}%"
