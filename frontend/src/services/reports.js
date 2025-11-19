// src/services/reports.js
import api from './api';

const buildListUrl = (patientId) => {
  if (patientId) return `/reports/?patient=${patientId}`;
  return `/reports/`;
};

export const reportsService = {
  // Core report operations
  list: async (patientId) => {
    const url = buildListUrl(patientId);
    const resp = await api.get(url);
    return resp.data;
  },

  create: async (data) => {
    const resp = await api.post('/reports/', data);
    return resp.data;
  },

  delete: async (id) => {
    const resp = await api.delete(`/reports/${id}/`);
    return resp.status === 204 || resp.status === 200;
  },

  // Get single report
  get: async (id) => {
    const resp = await api.get(`/reports/${id}/`);
    return resp.data;
  },

  // Update report
  update: async (id, data) => {
    const resp = await api.put(`/reports/${id}/`, data);
    return resp.data;
  },

  // Attachments operations
  listAttachments: async (reportId) => {
    const resp = await api.get(`/attachments/?report=${reportId}`);
    return resp.data;
  },

  uploadAttachment: async (reportId, file, attachment_type) => {
    const fd = new FormData();
    fd.append('report', reportId);
    fd.append('file', file);
    fd.append('attachment_type', attachment_type);
    const resp = await api.post('/attachments/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data;
  },

  deleteAttachment: async (attachmentId) => {
    const resp = await api.delete(`/attachments/${attachmentId}/`);
    return resp.status === 204 || resp.status === 200;
  },

  // Analytics and Research endpoints
  getAnonymizedReports: async () => {
    const resp = await api.get('/reports/anonymized/');
    return resp.data;
  },

  exportAnonymizedReports: async () => {
    const resp = await api.get('/reports/anonymized/export/', {
      responseType: 'blob' // Important for file downloads
    });
    return resp.data;
  },

  // Analytics dashboard data
  getReportStatistics: async () => {
    const resp = await api.get('/reports/statistics/');
    return resp.data;
  },

  // Patient-specific analytics (for providers)
  getPatientReportAnalytics: async (patientId) => {
    const resp = await api.get(`/reports/analytics/patient/${patientId}/`);
    return resp.data;
  },

  // Search and filter reports
  searchReports: async (query, filters = {}) => {
    const params = { search: query, ...filters };
    const resp = await api.get('/reports/search/', { params });
    return resp.data;
  },

  // Bulk operations (for admins)
  bulkDelete: async (reportIds) => {
    const resp = await api.post('/reports/bulk-delete/', { report_ids: reportIds });
    return resp.data;
  },

  // Export patient reports (for providers)
  exportPatientReports: async (patientId, format = 'pdf') => {
    const resp = await api.get(`/reports/export/patient/${patientId}/`, {
      params: { format },
      responseType: 'blob'
    });
    return resp.data;
  },

  // Report templates (for standardized reporting)
  listTemplates: async () => {
    const resp = await api.get('/report-templates/');
    return resp.data;
  },

  createFromTemplate: async (templateId, patientId, data = {}) => {
    const resp = await api.post(`/report-templates/${templateId}/generate/`, {
      patient_id: patientId,
      ...data
    });
    return resp.data;
  }
};

export default reportsService;