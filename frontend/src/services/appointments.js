import api from './api';

const endpoint = '/appointments/';

export const appointmentsService = {
  list: async () => {
    const res = await api.get(endpoint);
    return res.data;
  },

  get: async (id) => {
    const res = await api.get(`${endpoint}${id}/`);
    return res.data;
  },

  create: async (payload) => {
    const res = await api.post(endpoint, payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`${endpoint}${id}/`, payload);
    return res.data;
  },

  remove: async (id) => {
    const res = await api.delete(`${endpoint}${id}/`);
    return res.data;
  }
};
