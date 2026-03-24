# backend/notifications/serializers.py
from rest_framework import serializers
from .models import Notification, UserNotificationPreferences

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'type', 'priority', 
                  'is_read', 'related_url', 'related_id', 'created_at']
        read_only_fields = ['id', 'created_at']

class NotificationPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotificationPreferences
        fields = ['id', 'email_enabled', 'push_enabled', 'appointment_reminders',
                  'lab_results', 'prescription_updates', 'messages', 
                  'weekly_summary', 'marketing', 'send_email', 'send_push']