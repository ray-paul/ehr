// src/services/chat.js
import api from './api';

const chatService = {
  // Conversations
  getConversations: async () => {
    const resp = await api.get('/chat/conversations/');
    return resp.data;
  },
  
  getConversation: async (id) => {
    const resp = await api.get(`/chat/conversations/${id}/`);
    return resp.data;
  },
  
  startConversation: async (userId) => {
    const resp = await api.post('/chat/conversations/start/', { user_id: userId });
    return resp.data;
  },
  
  getUnreadCount: async () => {
    const resp = await api.get('/chat/conversations/unread_count/');
    return resp.data;
  },
  
  markConversationRead: async (conversationId) => {
    const resp = await api.post(`/chat/conversations/${conversationId}/mark_read/`);
    return resp.data;
  },
  
  searchUsers: async (query) => {
    const resp = await api.get('/chat/conversations/search_users/', { params: { q: query } });
    return resp.data;
  },
  
  // Messages
  getMessages: async (conversationId) => {
    const resp = await api.get(`/chat/messages/`, { params: { conversation: conversationId } });
    return resp.data;
  },
  
  sendMessage: async (conversationId, content, attachment = null) => {
    const formData = new FormData();
    formData.append('conversation', conversationId);
    formData.append('content', content);
    if (attachment) {
      formData.append('attachment', attachment);
      formData.append('attachment_name', attachment.name);
    }
    
    const resp = await api.post('/chat/messages/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return resp.data;
  },
  
  sendNewMessage: async (recipientId, content, attachment = null) => {
    const formData = new FormData();
    formData.append('recipient', recipientId);
    formData.append('content', content);
    if (attachment) {
      formData.append('attachment', attachment);
      formData.append('attachment_name', attachment.name);
    }
    
    const resp = await api.post('/chat/messages/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return resp.data;
  },
  
  markMessageRead: async (messageId) => {
    const resp = await api.patch(`/chat/messages/${messageId}/mark_read/`);
    return resp.data;
  }
};

export default chatService;