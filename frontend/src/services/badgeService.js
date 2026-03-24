// src/services/badgeService.js
import api from './api';

const badgeService = {
  getNotificationCount: async () => {
    try {
      const resp = await api.get('/notifications/notifications/unread_count/');
      return resp.data.count;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  },
  
  getMessageCount: async () => {
    try {
      const resp = await api.get('/chat/conversations/unread_count/');
      return resp.data.count;
    } catch (error) {
      console.error('Error fetching message count:', error);
      return 0;
    }
  },
  
  startPolling: (callback) => {
    const interval = setInterval(async () => {
      try {
        const notificationCount = await badgeService.getNotificationCount();
        const messageCount = await badgeService.getMessageCount();
        callback({ notificationCount, messageCount });
      } catch (error) {
        console.error('Error polling badge counts:', error);
      }
    }, 30000);
    
    return interval;
  }
};

export default badgeService;