// src/services/notifications.js
import api from './api';

const notificationsService = {
  // Get all notifications for current user
  list: async (params = {}) => {
    const resp = await api.get('/notifications/', { params });
    return resp.data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const resp = await api.patch(`/notifications/${id}/mark-read/`);
    return resp.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const resp = await api.post('/notifications/mark-all-read/');
    return resp.data;
  },

  // Delete notification
  delete: async (id) => {
    const resp = await api.delete(`/notifications/${id}/`);
    return resp.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const resp = await api.get('/notifications/unread-count/');
    return resp.data;
  },

  // Get notification preferences
  getPreferences: async () => {
    const resp = await api.get('/notifications/preferences/');
    return resp.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    const resp = await api.put('/notifications/preferences/', preferences);
    return resp.data;
  }
};

export default notificationsService;