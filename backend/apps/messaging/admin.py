from django.contrib import admin
from .models import Message, MessageRecipient

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'sender', 'message_type', 'priority', 'is_broadcast', 'created_at']
    list_filter = ['message_type', 'priority', 'is_broadcast']
    search_fields = ['subject', 'content']
    date_hierarchy = 'created_at'

@admin.register(MessageRecipient)
class MessageRecipientAdmin(admin.ModelAdmin):
    list_display = ['message', 'recipient', 'is_read', 'read_at']
    list_filter = ['is_read']
