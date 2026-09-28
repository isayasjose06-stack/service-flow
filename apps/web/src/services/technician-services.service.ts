import axios from 'axios';

const api = axios.create({
  baseURL: '/api/technician/services',
  withCredentials: true,
});

export const technicianServicesService = {
  getMyServices: async () => {
    const res = await api.get('/');
    return res.data;
  },
  getServiceDetail: async (id: string) => {
    const res = await api.get(`/${id}`);
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await api.post(`/${id}/status`, { status });
    return res.data;
  }
};
