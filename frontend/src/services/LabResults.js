// src/services/labResults.js
import api from './api';

const labResultsService = {
  // Core lab results operations
  list: async (patientId = null) => {
    try {
      const params = patientId ? { patient: patientId } : {};
      const resp = await api.get('/lab-results/', { params });
      return resp.data;
    } catch (error) {
      console.error('Error fetching lab results:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const resp = await api.post('/lab-results/', data);
      return resp.data;
    } catch (error) {
      console.error('Error creating lab result:', error);
      throw error;
    }
  },

  get: async (id) => {
    try {
      const resp = await api.get(`/lab-results/${id}/`);
      return resp.data;
    } catch (error) {
      console.error('Error fetching lab result:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const resp = await api.put(`/lab-results/${id}/`, data);
      return resp.data;
    } catch (error) {
      console.error('Error updating lab result:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const resp = await api.delete(`/lab-results/${id}/`);
      return resp.status === 204 || resp.status === 200;
    } catch (error) {
      console.error('Error deleting lab result:', error);
      throw error;
    }
  },

  // Upload lab result files
  uploadFile: async (labResultId, file, fileType) => {
    try {
      const formData = new FormData();
      formData.append('lab_result', labResultId);
      formData.append('file', file);
      formData.append('file_type', fileType);
      
      const resp = await api.post('/lab-result-files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return resp.data;
    } catch (error) {
      console.error('Error uploading lab file:', error);
      throw error;
    }
  },

  // Lab result status management
  markAsReviewed: async (id) => {
    try {
      const resp = await api.patch(`/lab-results/${id}/mark_reviewed/`);
      return resp.data;
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      throw error;
    }
  },

  markAsCritical: async (id) => {
    try {
      const resp = await api.patch(`/lab-results/${id}/mark_critical/`);
      return resp.data;
    } catch (error) {
      console.error('Error marking as critical:', error);
      throw error;
    }
  },

  // Analytics and reporting
  getStatistics: async () => {
    try {
      const resp = await api.get('/lab-results/statistics/');
      return resp.data;
    } catch (error) {
      console.error('Error fetching lab statistics:', error);
      throw error;
    }
  },

  getPatientLabHistory: async (patientId) => {
    try {
      const resp = await api.get(`/lab-results/patient/${patientId}/history/`);
      return resp.data;
    } catch (error) {
      console.error('Error fetching patient lab history:', error);
      throw error;
    }
  },

  // Search and filtering
  search: async (query, filters = {}) => {
    try {
      const params = { search: query, ...filters };
      const resp = await api.get('/lab-results/search/', { params });
      return resp.data;
    } catch (error) {
      console.error('Error searching lab results:', error);
      throw error;
    }
  },

  // Lab test types and reference ranges
  getTestTypes: async () => {
    try {
      const resp = await api.get('/lab-tests/types/');
      return resp.data;
    } catch (error) {
      console.error('Error fetching test types:', error);
      throw error;
    }
  },

  getReferenceRanges: async (testType) => {
    try {
      const resp = await api.get(`/lab-tests/reference-ranges/${testType}/`);
      return resp.data;
    } catch (error) {
      console.error('Error fetching reference ranges:', error);
      throw error;
    }
  },

  // Export functionality
  exportLabResults: async (filters = {}) => {
    try {
      const resp = await api.get('/lab-results/export/', {
        params: filters,
        responseType: 'blob'
      });
      return resp.data;
    } catch (error) {
      console.error('Error exporting lab results:', error);
      throw error;
    }
  }
};

export default labResultsService;