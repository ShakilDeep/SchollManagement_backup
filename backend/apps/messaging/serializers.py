from rest_framework import serializers
from .models import Message, MessageRecipient

class MessageRecipientSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    recipient_email = serializers.CharField(source='recipient.email', read_only=True)

    class Meta:
        model = MessageRecipient
        fields = ['recipient', 'recipient_name', 'recipient_email', 'is_read', 'read_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    message_type_display = serializers.CharField(source='get_message_type_display', read_only=True)
    recipients = MessageRecipientSerializer(source='messagerecipient_set', many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'sender_email', 'subject', 'content',
            'message_type', 'message_type_display', 'priority', 'is_broadcast',
            'recipients', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class MessageCreateSerializer(serializers.ModelSerializer):
    recipient_ids = serializers.ListField(child=serializers.CharField(), write_only=True)

    class Meta:
        model = Message
        fields = [
            'subject', 'content', 'message_type', 'priority', 'is_broadcast', 'recipient_ids'
        ]

    def create(self, validated_data):
        recipient_ids = validated_data.pop('recipient_ids')
        sender = self.context['request'].user
        message = Message.objects.create(sender=sender, **validated_data)

        for recipient_id in recipient_ids:
            try:
                from apps.users.models import User
                recipient = User.objects.get(id=recipient_id)
                MessageRecipient.objects.create(message=message, recipient=recipient)
            except User.DoesNotExist:
                continue

        return message
