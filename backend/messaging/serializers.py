# backend/messages/serializers.py
from rest_framework import serializers
from django.db.models import Q
from .models import Conversation, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'user_type']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_type = serializers.CharField(source='sender.user_type', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_type', 
                  'content', 'attachment', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']
    
    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username

class ConversationSerializer(serializers.ModelSerializer):
    participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participant', 'participant1', 'participant2', 
                  'last_message', 'last_message_time', 'unread_count', 
                  'created_at', 'updated_at']
    
    def get_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            # Return the other participant
            if obj.participant1 == request.user:
                participant = obj.participant2
            else:
                participant = obj.participant1
            return UserSerializer(participant).data
        return None
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return last_msg.content if last_msg else None
    
    def get_last_message_time(self, obj):
        last_msg = obj.messages.last()
        return last_msg.created_at if last_msg else None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0