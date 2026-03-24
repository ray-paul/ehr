# backend/messages/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, UserSerializer

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        )
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get total number of unread messages"""
        user = request.user
        conversations = self.get_queryset()
        unread_count = Message.objects.filter(
            conversation__in=conversations,
            is_read=False
        ).exclude(sender=user).count()
        return Response({'count': unread_count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        conversation = self.get_object()
        user = request.user
        Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=user).update(is_read=True)
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start a new conversation with a user"""
        user_id = request.data.get('user_id')
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if conversation already exists
        conversation = Conversation.objects.filter(
            (Q(participant1=request.user) & Q(participant2=other_user)) |
            (Q(participant1=other_user) & Q(participant2=request.user))
        ).first()
        
        if not conversation:
            conversation = Conversation.objects.create(
                participant1=request.user,
                participant2=other_user
            )
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def search_users(self, request):
        """Search for users to start a conversation with"""
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])
        
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.filter(
            Q(conversation__participant1=self.request.user) |
            Q(conversation__participant2=self.request.user)
        )
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        conversation_id = self.request.data.get('conversation')
        if conversation_id:
            conversation = Conversation.objects.get(id=conversation_id)
        else:
            # Create new conversation if not provided
            recipient_id = self.request.data.get('recipient')
            recipient = User.objects.get(id=recipient_id)
            conversation = Conversation.objects.filter(
                (Q(participant1=self.request.user) & Q(participant2=recipient)) |
                (Q(participant1=recipient) & Q(participant2=self.request.user))
            ).first()
            if not conversation:
                conversation = Conversation.objects.create(
                    participant1=self.request.user,
                    participant2=recipient
                )
        
        serializer.save(
            conversation=conversation,
            sender=self.request.user
        )
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.sender != request.user:
            message.is_read = True
            message.save()
        return Response({'status': 'marked as read'})