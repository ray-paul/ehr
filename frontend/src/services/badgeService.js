// src/services/badgeService.js
import api from './api';

const badgeService = {
  getNotificationCount: async () => {
    try {
      const resp = await api.get('/notifications/unread-count/');
      return resp.data.count;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  },
  
  getMessageCount: async () => {
    try {
      const resp = await api.get('/messages/unread-count/');
      return resp.data.count;
    } catch (error) {
      console.error('Error fetching message count:', error);
      return 0;
    }
  },
  
  // Poll for updates every 30 seconds
  startPolling: (callback) => {
    const interval = setInterval(async () => {
      try {
        const [notificationCount, messageCount] = await Promise.all([
          badgeService.getNotificationCount(),
          badgeService.getMessageCount()
        ]);
        callback({ notificationCount, messageCount });
      } catch (error) {
        console.error('Error polling badge counts:', error);
      }
    }, 30000); // Poll every 30 seconds
    
    return interval;
  }
};

export default badgeService;