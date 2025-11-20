// frontend/src/services/appointments.js
import api from './api';

const endpoint = '/appointments/appointments/';

export const appointmentsService = {
  // Basic CRUD operations
  list: async () => {
    try {
      const res = await api.get(endpoint);
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
      const res = await api.put(`${endpoint}${id}/`, payload);
      return res.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  remove: async (id) => {
    try {
      const res = await api.delete(`${endpoint}${id}/`);
      return res.data;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },

  // Appointment negotiation features
  proposeTime: async (id, proposedDate) => {
    try {
      const res = await api.post(`${endpoint}${id}/propose_time/`, { 
        proposed_date: proposedDate 
      });
      return res.data;
    } catch (error) {
      console.error('Error proposing time:', error);
      throw error;
    }
  },

  confirm: async (id, confirmedDate = null) => {
    try {
      const payload = confirmedDate ? { confirmed_date: confirmedDate } : {};
      const res = await api.post(`${endpoint}${id}/confirm/`, payload);
      return res.data;
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  },

  // Message management
  addMessage: async (id, message) => {
    try {
      const res = await api.post(`${endpoint}${id}/add_message/`, { 
        message: message 
      });
      return res.data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  getMessages: async (id) => {
    try {
      const res = await api.get(`/appointments/appointments/${id}/messages/`);
      return res.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Status management
  cancel: async (id) => {
    try {
      const res = await api.post(`${endpoint}${id}/cancel/`);
      return res.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  // Provider-specific operations
  getProviderAppointments: async (providerId) => {
    try {
      const res = await api.get(`${endpoint}?provider=${providerId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching provider appointments:', error);
      throw error;
    }
  },

  getPatientAppointments: async (patientId) => {
    try {
      const res = await api.get(`${endpoint}?patient=${patientId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw error;
    }
  },

  // Utility functions
  getStatusColor: (status) => {
    const statusColors = {
      'requested': 'warning',
      'proposed': 'info', 
      'confirmed': 'success',
      'cancelled': 'danger',
      'completed': 'secondary'
    };
    return statusColors[status] || 'secondary';
  },

  getStatusText: (status) => {
    const statusTexts = {
      'requested': 'Requested',
      'proposed': 'Counter Proposed', 
      'confirmed': 'Confirmed',
      'cancelled': 'Cancelled',
      'completed': 'Completed'
    };
    return statusTexts[status] || status;
  },

  // Fallback data for development
  getFallbackData: () => {
    return [
      { 
        id: 1, 
        title: 'General Checkup', 
        patient_name: 'John Doe', 
        provider_name: 'Dr. Smith',
        status: 'requested',
        patient_suggested_date: '2025-11-20T10:00:00Z',
        created_at: '2025-11-18T09:00:00Z'
      },
      { 
        id: 2, 
        title: 'Follow-up Consultation', 
        patient_name: 'Jane Smith', 
        provider_name: 'Dr. Johnson',
        status: 'proposed',
        patient_suggested_date: '2025-11-19T14:00:00Z',
        provider_proposed_date: '2025-11-19T15:00:00Z',
        created_at: '2025-11-17T16:00:00Z'
      },
      { 
        id: 3, 
        title: 'Annual Physical', 
        patient_name: 'Bob Wilson', 
        provider_name: 'Dr. Brown',
        status: 'confirmed',
        patient_suggested_date: '2025-11-22T09:00:00Z',
        confirmed_date: '2025-11-22T09:00:00Z',
        created_at: '2025-11-16T11:00:00Z'
      }
    ];
  }
};

export default appointmentsService;