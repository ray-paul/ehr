// src/services/prescriptions.js
import api from './api';

const prescriptionsService = {
  // Core prescription operations
  list: async (patientId = null) => {
    const params = patientId ? { patient: patientId } : {};
    const resp = await api.get('/prescriptions/', { params });
    return resp.data;
  },

  create: async (data) => {
    const resp = await api.post('/prescriptions/', data);
    return resp.data;
  },

  get: async (id) => {
    const resp = await api.get(`/prescriptions/${id}/`);
    return resp.data;
  },

  update: async (id, data) => {
    const resp = await api.put(`/prescriptions/${id}/`, data);
    return resp.data;
  },

  delete: async (id) => {
    const resp = await api.delete(`/prescriptions/${id}/`);
    return resp.status === 204 || resp.status === 200;
  },

  // Prescription status management
  markAsDispensed: async (id) => {
    const resp = await api.patch(`/prescriptions/${id}/mark_dispensed/`);
    return resp.data;
  },

  markAsCancelled: async (id) => {
    const resp = await api.patch(`/prescriptions/${id}/mark_cancelled/`);
    return resp.data;
  },

  // Analytics and reporting
  getStatistics: async () => {
    const resp = await api.get('/prescriptions/statistics/');
    return resp.data;
  },

  getPatientPrescriptionHistory: async (patientId) => {
    const resp = await api.get(`/prescriptions/patient/${patientId}/history/`);
    return resp.data;
  },

  // Search and filtering
  search: async (query, filters = {}) => {
    const params = { search: query, ...filters };
    const resp = await api.get('/prescriptions/search/', { params });
    return resp.data;
  },

  // Export functionality
  exportPrescriptions: async (filters = {}) => {
    const resp = await api.get('/prescriptions/export/', {
      params: filters,
      responseType: 'blob'
    });
    return resp.data;
  },

  // Drug database lookup
  searchDrugs: async (query) => {
    const resp = await api.get('/drugs/search/', { params: { query } });
    return resp.data;
  }
};

export default prescriptionsService;