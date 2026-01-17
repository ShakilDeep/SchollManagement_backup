from django.db import models
from apps.students.models import Student
from apps.users.models import User
import uuid

class BehaviorType(models.TextChoices):
    POSITIVE = 'POSITIVE', 'Positive'
    NEGATIVE = 'NEGATIVE', 'Negative'

class BehaviorRecord(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    behavior_type = models.CharField(max_length=20, choices=BehaviorType.choices)
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    severity = models.CharField(max_length=20, default='MEDIUM')
    points = models.IntegerField(default=0)
    action_taken = models.TextField(blank=True, null=True)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_behaviors')
    resolved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['behavior_type']),
            models.Index(fields=['date']),
            models.Index(fields=['is_resolved']),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.title}"
