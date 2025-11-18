import api from './api';

export const reportsService = {
  list: async () => {
    const resp = await api.get('/reports/');
    return resp.data;
  },
};

export default reportsService;
