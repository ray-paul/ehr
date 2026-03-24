# backend/chat/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone

class Conversation(models.Model):
    """Represents a conversation between two users"""
    participant1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations_as_participant1'
    )
    participant2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations_as_participant2'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['participant1', 'participant2']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.participant1.username} ↔ {self.participant2.username}"
    
    def get_other_participant(self, user):
        """Get the other participant in the conversation"""
        if self.participant1 == user:
            return self.participant2
        return self.participant1
    
    def get_unread_count(self, user):
        """Get number of unread messages for a user in this conversation"""
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    """Individual message in a conversation"""
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    attachment = models.FileField(upload_to='chat_attachments/%Y/%m/%d/', blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()