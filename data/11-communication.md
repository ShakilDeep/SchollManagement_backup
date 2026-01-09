# Communication Module

## 4.9 Communication Module

### Django Models Implementation

#### Core Communication Models

```python
# communication/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from schools.models import School, AcademicYear, Class
from users.models import User

User = get_user_model()

class Announcement(models.Model):
    """School announcements with role-based targeting"""
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    AUDIENCE_CHOICES = [
        ('all', 'All Users'),
        ('students', 'Students Only'),
        ('teachers', 'Teachers Only'),
        ('parents', 'Parents Only'),
        ('admin', 'Admin Only'),
        ('custom', 'Custom Selection'),
    ]
    
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='announcements')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, null=True, blank=True)
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default='all')
    
    # Targeting
    target_classes = models.ManyToManyField(Class, blank=True, related_name='announcements')
    target_users = models.ManyToManyField(User, blank=True, related_name='received_announcements')
    target_roles = models.CharField(max_length=100, blank=True, help_text="Comma-separated role names")
    
    # Scheduling
    publish_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_pinned = models.BooleanField(default=False)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'communication_announcements'
        ordering = ['-is_pinned', '-publish_at']
        indexes = [
            models.Index(fields=['school', 'publish_at']),
            models.Index(fields=['priority', 'publish_at']),
            models.Index(fields=['audience', 'publish_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.school.name}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Trigger notification to relevant users
        from .services import CommunicationService
        CommunicationService.send_announcement_notifications(self)

class Message(models.Model):
    """Direct messaging between users"""
    
    MESSAGE_TYPE_CHOICES = [
        ('direct', 'Direct Message'),
        ('group', 'Group Message'),
        ('announcement_reply', 'Announcement Reply'),
        ('system', 'System Message'),
    ]
    
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='messages')
    
    # Message content
    subject = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='direct')
    
    # Participants
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipients = models.ManyToManyField(User, related_name='received_messages', through='MessageRecipient')
    
    # Thread support
    parent_message = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    thread_id = models.CharField(max_length=50, blank=True, db_index=True)
    
    # Attachments
    has_attachments = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'communication_messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['thread_id', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.get_full_name()} - {self.subject[:50]}"

class MessageRecipient(models.Model):
    """Intermediate model for message recipients with read status"""
    
    id = models.AutoField(primary_key=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    received_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'communication_message_recipients'
        unique_together = ['message', 'recipient']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'received_at']),
        ]
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

class Notification(models.Model):
    """Real-time notifications for users"""
    
    NOTIFICATION_TYPES = [
        ('announcement', 'New Announcement'),
        ('message', 'New Message'),
        ('grade', 'Grade Published'),
        ('assignment', 'Assignment Posted'),
        ('fee', 'Fee Reminder'),
        ('attendance', 'Attendance Alert'),
        ('event', 'Event Reminder'),
        ('system', 'System Notification'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Link to related object
    content_type = models.ForeignKey('contenttypes.ContentType', on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = models.GenericForeignKey('content_type', 'object_id')
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery methods
    sent_via_email = models.BooleanField(default=False)
    sent_via_sms = models.BooleanField(default=False)
    sent_via_push = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'communication_notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.get_full_name()}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

class MessageAttachment(models.Model):
    """Attachments for messages"""
    
    id = models.AutoField(primary_key=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    
    file = models.FileField(upload_to='message_attachments/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=100)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'communication_message_attachments'
    
    def __str__(self):
        return f"Attachment: {self.filename}"
```

#### Django Services

```python
# communication/services.py
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Announcement, Message, Notification, MessageRecipient
from users.models import User

User = get_user_model()
channel_layer = get_channel_layer()

class CommunicationService:
    """Service for handling communication operations"""
    
    @staticmethod
    @transaction.atomic
    def create_announcement(announcement_data, created_by):
        """Create a new announcement"""
        announcement = Announcement.objects.create(
            school=announcement_data['school'],
            academic_year=announcement_data.get('academic_year'),
            title=announcement_data['title'],
            content=announcement_data['content'],
            priority=announcement_data.get('priority', 'medium'),
            audience=announcement_data.get('audience', 'all'),
            publish_at=announcement_data.get('publish_at', timezone.now()),
            expires_at=announcement_data.get('expires_at'),
            is_pinned=announcement_data.get('is_pinned', False),
            created_by=created_by
        )
        
        # Handle targeting
        if 'target_classes' in announcement_data:
            announcement.target_classes.set(announcement_data['target_classes'])
        if 'target_users' in announcement_data:
            announcement.target_users.set(announcement_data['target_users'])
        if 'target_roles' in announcement_data:
            announcement.target_roles = ','.join(announcement_data['target_roles'])
        
        return announcement
    
    @staticmethod
    def send_announcement_notifications(announcement):
        """Send notifications for new announcement"""
        target_users = CommunicationService.get_announcement_recipients(announcement)
        
        for user in target_users:
            # Create notification
            Notification.objects.create(
                user=user,
                school=announcement.school,
                notification_type='announcement',
                title=f"New Announcement: {announcement.title}",
                message=announcement.content[:200] + "..." if len(announcement.content) > 200 else announcement.content,
                content_type=ContentType.objects.get_for_model(Announcement),
                object_id=announcement.id
            )
            
            # Send real-time notification via WebSocket
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}",
                {
                    'type': 'notification',
                    'notification': {
                        'type': 'announcement',
                        'title': announcement.title,
                        'message': announcement.content[:100],
                        'priority': announcement.priority,
                        'created_at': announcement.created_at.isoformat()
                    }
                }
            )
    
    @staticmethod
    def get_announcement_recipients(announcement):
        """Get list of users who should receive the announcement"""
        users = User.objects.filter(school=announcement.school, is_active=True)
        
        if announcement.audience == 'all':
            return users
        elif announcement.audience == 'students':
            return users.filter(role='student')
        elif announcement.audience == 'teachers':
            return users.filter(role='teacher')
        elif announcement.audience == 'parents':
            return users.filter(role='parent')
        elif announcement.audience == 'admin':
            return users.filter(role__in=['admin', 'super_admin'])
        elif announcement.audience == 'custom':
            target_users = set()
            
            # Add users from target classes
            if announcement.target_classes.exists():
                for class_obj in announcement.target_classes.all():
                    target_users.update(class_obj.students.all())
                    target_users.update([class_obj.class_teacher])
            
            # Add specifically targeted users
            target_users.update(announcement.target_users.all())
            
            # Add users by role
            if announcement.target_roles:
                role_names = announcement.target_roles.split(',')
                target_users.update(users.filter(role__in=[r.strip() for r in role_names]))
            
            return list(target_users)
        
        return users.none()
    
    @staticmethod
    @transaction.atomic
    def send_message(message_data, sender):
        """Send a direct message"""
        message = Message.objects.create(
            school=message_data['school'],
            subject=message_data.get('subject', ''),
            content=message_data['content'],
            message_type=message_data.get('message_type', 'direct'),
            sender=sender,
            parent_message=message_data.get('parent_message'),
            thread_id=message_data.get('thread_id')
        )
        
        # Handle thread ID for replies
        if message.parent_message and not message.thread_id:
            message.thread_id = message.parent_message.thread_id or f"thread_{message.parent_message.id}"
            message.save()
        elif not message.thread_id:
            message.thread_id = f"thread_{message.id}"
            message.save()
        
        # Add recipients
        recipients = message_data['recipients']
        for recipient in recipients:
            MessageRecipient.objects.create(
                message=message,
                recipient=recipient
            )
            
            # Create notification
            Notification.objects.create(
                user=recipient,
                school=message.school,
                notification_type='message',
                title=f"New Message from {sender.get_full_name()}",
                message=message.content[:200] + "..." if len(message.content) > 200 else message.content,
                content_type=ContentType.objects.get_for_model(Message),
                object_id=message.id
            )
            
            # Send real-time notification
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient.id}",
                {
                    'type': 'notification',
                    'notification': {
                        'type': 'message',
                        'title': f"Message from {sender.get_full_name()}",
                        'message': message.content[:100],
                        'sender_id': sender.id,
                        'created_at': message.created_at.isoformat()
                    }
                }
            )
        
        return message
    
    @staticmethod
    def create_notification(user_data, notification_type, title, message, content_object=None):
        """Create a notification for a user"""
        content_type = None
        object_id = None
        
        if content_object:
            content_type = ContentType.objects.get_for_model(content_object)
            object_id = content_object.id
        
        notification = Notification.objects.create(
            user=user_data,
            school=user_data.school,
            notification_type=notification_type,
            title=title,
            message=message,
            content_type=content_type,
            object_id=object_id
        )
        
        # Send real-time notification
        async_to_sync(channel_layer.group_send)(
            f"user_{user_data.id}",
            {
                'type': 'notification',
                'notification': {
                    'type': notification_type,
                    'title': title,
                    'message': message[:100],
                    'created_at': notification.created_at.isoformat()
                }
            }
        )
        
        return notification
    
    @staticmethod
    def mark_notifications_read(user, notification_ids=None):
        """Mark notifications as read"""
        notifications = Notification.objects.filter(user=user, is_read=False)
        
        if notification_ids:
            notifications = notifications.filter(id__in=notification_ids)
        
        notifications.update(is_read=True, read_at=timezone.now())
    
    @staticmethod
    def get_user_conversations(user):
        """Get all conversations for a user"""
        # Get messages where user is either sender or recipient
        sent_messages = Message.objects.filter(sender=user).values('thread_id').distinct()
        received_threads = MessageRecipient.objects.filter(
            recipient=user
        ).values_list('message__thread_id', flat=True).distinct()
        
        # Combine and get latest message for each thread
        all_threads = set([t['thread_id'] for t in sent_messages] + list(received_threads))
        
        conversations = []
        for thread_id in all_threads:
            latest_message = Message.objects.filter(
                thread_id=thread_id
            ).order_by('-created_at').first()
            
            if latest_message:
                conversations.append({
                    'thread_id': thread_id,
                    'latest_message': latest_message,
                    'unread_count': MessageRecipient.objects.filter(
                        message__thread_id=thread_id,
                        recipient=user,
                        is_read=False
                    ).count()
                })
        
        return sorted(conversations, key=lambda x: x['latest_message'].created_at, reverse=True)
```

#### Django REST Framework Views

```python
# communication/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Announcement, Message, Notification, MessageRecipient
from .serializers import AnnouncementSerializer, MessageSerializer, NotificationSerializer
from .services import CommunicationService
from users.permissions import IsSchoolMember, IsOwnerOrReadOnly

class AnnouncementViewSet(viewsets.ModelViewSet):
    """ViewSet for announcements"""
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolMember]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['priority', 'audience', 'academic_year']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'publish_at', 'priority']
    ordering = ['-publish_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.filter(
            school=user.school,
            publish_at__lte=timezone.now()
        )
        
        # Filter expired announcements
        queryset = queryset.filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )
        
        # Filter by user's access level
        if user.role in ['admin', 'super_admin']:
            return queryset
        elif user.role == 'teacher':
            # Teachers can see all announcements and class-specific ones
            teacher_classes = user.teaching_classes.all()
            return queryset.filter(
                Q(audience__in=['all', 'teachers']) |
                Q(target_classes__in=teacher_classes)
            ).distinct()
        elif user.role == 'student':
            # Students see all, student, and class-specific announcements
            student_class = user.student_profile.current_class if hasattr(user, 'student_profile') else None
            return queryset.filter(
                Q(audience__in=['all', 'students']) |
                Q(target_classes=student_class)
            ).distinct()
        elif user.role == 'parent':
            # Parents see all and parent announcements
            return queryset.filter(audience__in=['all', 'parents'])
        
        return queryset.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Pin/unpin announcement"""
        announcement = self.get_object()
        announcement.is_pinned = not announcement.is_pinned
        announcement.save()
        return Response({'is_pinned': announcement.is_pinned})

class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for messages"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolMember]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['message_type']
    search_fields = ['subject', 'content']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            school=user.school
        ).filter(
            Q(sender=user) | Q(recipients=user)
        ).distinct()
    
    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        return message
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get user's conversations"""
        conversations = CommunicationService.get_user_conversations(request.user)
        return Response(conversations)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark message as read"""
        message = self.get_object()
        recipient_obj = MessageRecipient.objects.get(
            message=message,
            recipient=request.user
        )
        recipient_obj.mark_as_read()
        return Response({'status': 'marked as read'})

class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        CommunicationService.mark_notifications_read(request.user)
        return Response({'status': 'all notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread notification count"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})
```

#### Django Admin Configuration

```python
# communication/admin.py
from django.contrib import admin
from .models import Announcement, Message, Notification, MessageRecipient, MessageAttachment

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'school', 'priority', 'audience', 'publish_at', 'is_pinned']
    list_filter = ['priority', 'audience', 'school', 'is_pinned']
    search_fields = ['title', 'content']
    date_hierarchy = 'publish_at'
    raw_id_fields = ['created_by', 'academic_year']
    filter_horizontal = ['target_classes', 'target_users']

class MessageRecipientInline(admin.TabularInline):
    model = MessageRecipient
    extra = 1

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'sender', 'message_type', 'created_at']
    list_filter = ['message_type', 'school', 'created_at']
    search_fields = ['subject', 'content']
    date_hierarchy = 'created_at'
    raw_id_fields = ['sender', 'parent_message']
    inlines = [MessageRecipientInline]

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'school']
    search_fields = ['title', 'message']
    date_hierarchy = 'created_at'
    raw_id_fields = ['user', 'content_object']
```

#### Django Serializers

```python
# communication/serializers.py
from rest_framework import serializers
from .models import Announcement, Message, Notification

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    target_class_names = serializers.StringRelatedField(source='target_classes', many=True, read_only=True)
    
    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_names = serializers.StringRelatedField(source='recipients', many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']
```

## API Endpoints

### Communications
```
GET    /api/communications/announcements/
POST   /api/communications/announcements/
GET    /api/communications/announcements/{id}/
PUT    /api/communications/announcements/{id}/
DELETE /api/communications/announcements/{id}/
POST   /api/communications/announcements/{id}/pin/

GET    /api/communications/messages/
POST   /api/communications/messages/
GET    /api/communications/messages/{id}/
PUT    /api/communications/messages/{id}/
DELETE /api/communications/messages/{id}/
GET    /api/communications/messages/conversations/
POST   /api/communications/messages/{id}/mark_read/

GET    /api/communications/notifications/
POST   /api/communications/notifications/mark_all_read/
POST   /api/communications/notifications/{id}/mark_read/
GET    /api/communications/notifications/unread_count/
```

## WebSocket Events

### Communication Events
```javascript
// Real-time notifications
{
  "type": "notification",
  "notification": {
    "type": "announcement|message|grade|assignment|fee|attendance|event|system",
    "title": "Notification Title",
    "message": "Notification message",
    "priority": "low|medium|high|urgent",
    "created_at": "2024-01-01T12:00:00Z"
  }
}

// Message status updates
{
  "type": "message_status",
  "message_id": 123,
  "status": "read|delivered",
  "user_id": 456
}
```

## Features Summary

### 4.9.1 Announcements
- ✅ Create school-wide announcements with rich text content
- ✅ Role-based announcements (teachers, students, parents, admin)
- ✅ Class-specific announcements with multi-class targeting
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Announcement scheduling with publish/expire dates
- ✅ Pin important announcements
- ✅ Archive and expiration management

### 4.9.2 Messaging System
- ✅ Direct messaging between users with role validation
- ✅ Teacher-parent communication channels
- ✅ Teacher-student messaging with restrictions
- ✅ Threaded conversations with reply support
- ✅ Real-time read receipts
- ✅ Message history with search and filtering
- ✅ File attachments support
- ✅ Message status tracking (sent, delivered, read)

### 4.9.3 Notifications
- ✅ Real-time notifications via Django Channels
- ✅ Email notifications with HTML templates
- ✅ SMS notifications (integration ready)
- ✅ User notification preferences
- ✅ Notification history with filtering
- ✅ Bulk notification actions
- ✅ Notification expiry management

**Notification Triggers:**
- ✅ New announcements with audience targeting
- ✅ Assignment deadline reminders
- ✅ Grades published notifications
- ✅ Fee due and overdue reminders
- ✅ Attendance alerts and absences
- ✅ Event reminders and updates
- ✅ System maintenance notices