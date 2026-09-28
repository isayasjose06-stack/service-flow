import axios from 'axios';

const api = axios.create({
  baseURL: '/api/technician/service-requests',
  withCredentials: true,
});

export const technicianRequestsService = {
  getMyMatches: async () => {
    const res = await api.get('/');
    return res.data;
  },
  getMatchDetail: async (id: string) => {
    const res = await api.get(`/${id}`);
    return res.data;
  },
  markAsViewed: async (id: string) => {
    const res = await api.post(`/${id}/view`);
    return res.data;
  },
  respond: async (id: string, action: 'ACCEPT' | 'REJECT') => {
    const res = await api.post(`/${id}/respond`, { action });
    return res.data;
  },
};
