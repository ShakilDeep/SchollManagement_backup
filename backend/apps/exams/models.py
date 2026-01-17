from django.db import models
from apps.students.models import Student, Grade, Section, AcademicYear
import uuid

class Exam(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    exam_type = models.CharField(max_length=50)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    total_marks = models.IntegerField(default=100)
    passing_marks = models.IntegerField(default=33)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['academic_year']),
            models.Index(fields=['grade']),
            models.Index(fields=['start_date']),
        ]

    def __str__(self):
        return f"{self.name} - {self.grade}"

class Result(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    total_marks = models.IntegerField()
    grade = models.CharField(max_length=5)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'exam', 'subject']
        indexes = [
            models.Index(fields=['student', 'exam']),
        ]

    def __str__(self):
        return f"{self.student} - {self.exam} - {self.subject}"
