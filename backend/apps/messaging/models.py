from django.db import models
from apps.users.models import User
import uuid

class MessageType(models.TextChoices):
    ANNOUNCEMENT = 'ANNOUNCEMENT', 'Announcement'
    NOTIFICATION = 'NOTIFICATION', 'Notification'
    PRIVATE = 'PRIVATE', 'Private Message'

class Message(models.Model):
    id = models.CharField(max_length=255, primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipients = models.ManyToManyField(User, through='MessageRecipient', related_name='received_messages')
    subject = models.CharField(max_length=500)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MessageType.choices, default=MessageType.PRIVATE)
    priority = models.CharField(max_length=20, default='NORMAL')
    is_broadcast = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['message_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.subject

class MessageRecipient(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ['message', 'recipient']
        indexes = [
            models.Index(fields=['recipient']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"{self.message.subject} -> {self.recipient.get_full_name()}"
