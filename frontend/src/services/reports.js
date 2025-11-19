import api from './api';

const buildListUrl = (patientId) => {
  if (patientId) return `/reports/?patient=${patientId}`;
  return `/reports/`;
};

export const reportsService = {
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
  // Attachments
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
};

export default reportsService;
