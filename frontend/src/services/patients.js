import api from './api';

const endpoint = '/patients/patients/';

export const patientsService = {
  list: async () => {
    const res = await api.get(endpoint);
    return res.data;
  },

  get: async (id) => {
    const res = await api.get(`${endpoint}${id}/`);
    return res.data;
  }
};

export default patientsService;
