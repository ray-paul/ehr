// frontend/src/services/appointments.js
import api from './api';

const endpoint = '/appointments_app/appointments/';

export const appointmentsService = {
  // Basic CRUD
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`${endpoint}?${params}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  get: async (id) => {
    try {
      const res = await api.get(`${endpoint}${id}/`);
      return res.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  },

  create: async (payload) => {
    try {
      const res = await api.post(endpoint, payload);
      return res.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  update: async (id, payload) => {
    try {
      const res = await api.patch(`${endpoint}${id}/`, payload);
      return res.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`${endpoint}${id}/`);
      return res.data;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },

  // Appointment actions
  proposeTime: async (id, proposedDate, message = '') => {
    try {
      const res = await api.post(`${endpoint}${id}/propose_time/`, {
        proposed_date: proposedDate,
        message
      });
      return res.data;
    } catch (error) {
      console.error('Error proposing time:', error);
      throw error;
    }
  },

  confirm: async (id, confirmedDate = null, message = '') => {
    try {
      const payload = { message };
      if (confirmedDate) payload.confirmed_date = confirmedDate;
      
      const res = await api.post(`${endpoint}${id}/confirm/`, payload);
      return res.data;
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  },

  cancel: async (id, reason) => {
    try {
      const res = await api.post(`${endpoint}${id}/cancel/`, { reason });
      return res.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  complete: async (id) => {
    try {
      const res = await api.post(`${endpoint}${id}/complete/`);
      return res.data;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  },

  reschedule: async (id, newDate, reason = '') => {
    try {
      const res = await api.post(`${endpoint}${id}/reschedule/`, {
        new_date: newDate,
        reason
      });
      return res.data;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  },

  // Messaging
  addMessage: async (id, message) => {
    try {
      const res = await api.post(`${endpoint}${id}/add_message/`, { message });
      return res.data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  getMessages: async (id) => {
    try {
      const res = await api.get(`${endpoint}${id}/messages/`);
      return res.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Feedback
  submitFeedback: async (id, rating, feedback = '') => {
    try {
      const res = await api.post(`${endpoint}${id}/feedback/`, { rating, feedback });
      return res.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  // Special queries
  getUpcoming: async () => {
    try {
      const res = await api.get(`${endpoint}upcoming/`);
      return res.data;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  },

  getToday: async () => {
    try {
      const res = await api.get(`${endpoint}today/`);
      return res.data;
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  },

  // Utility functions
  getStatusBadge: (status) => {
    const badges = {
      'requested': { color: 'bg-yellow-100 text-yellow-800', label: 'Requested', icon: '⏳' },
      'proposed': { color: 'bg-blue-100 text-blue-800', label: 'Proposed', icon: '🔄' },
      'confirmed': { color: 'bg-green-100 text-green-800', label: 'Confirmed', icon: '✅' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: '❌' },
      'completed': { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: '✓' },
      'no_show': { color: 'bg-orange-100 text-orange-800', label: 'No Show', icon: '⚠️' },
      'rescheduled': { color: 'bg-purple-100 text-purple-800', label: 'Rescheduled', icon: '↻' }
    };
    return badges[status] || badges.requested;
  },

  getAppointmentTypeIcon: (type) => {
    const icons = {
      'checkup': '🏥',
      'followup': '🔄',
      'emergency': '🚨',
      'consultation': '👨‍⚕️',
      'procedure': '🔧',
      'vaccination': '💉',
      'lab_test': '🔬',
      'imaging': '📷'
    };
    return icons[type] || '📅';
  }
};