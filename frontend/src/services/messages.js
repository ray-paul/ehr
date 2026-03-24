// src/services/messages.js
import api from './api';

const messagesService = {
  // Get conversations list
  getConversations: async () => {
    const resp = await api.get('/messages/conversations/');
    return resp.data;
  },

  // Get messages for a specific conversation
  getMessages: async (conversationId, params = {}) => {
    const resp = await api.get(`/messages/conversations/${conversationId}/`, { params });
    return resp.data;
  },

  // Send a new message
  sendMessage: async (recipientId, content, attachment = null) => {
    const formData = new FormData();
    formData.append('recipient', recipientId);
    formData.append('content', content);
    if (attachment) {
      formData.append('attachment', attachment);
    }
    const resp = await api.post('/messages/send/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return resp.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const resp = await api.patch(`/messages/${messageId}/mark-read/`);
    return resp.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const resp = await api.get('/messages/unread-count/');
    return resp.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    const resp = await api.delete(`/messages/conversations/${conversationId}/`);
    return resp.data;
  },

  // Archive conversation
  archiveConversation: async (conversationId) => {
    const resp = await api.patch(`/messages/conversations/${conversationId}/archive/`);
    return resp.data;
  }
};

export default messagesService;