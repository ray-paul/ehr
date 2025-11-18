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
};

export default reportsService;
