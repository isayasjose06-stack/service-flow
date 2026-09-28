import axios from 'axios';

const API_URL = '/api/services';

export const ServiceManager = {
  getMyServices: async () => {
    const res = await axios.get(`${API_URL}/my-services`);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  },

  registerPayment: async (id: string, amount: number, method: string, externalReference?: string) => {
    const res = await axios.post(`${API_URL}/${id}/payment`, { amount, method, externalReference });
    return res.data;
  },

  submitRating: async (id: string, score: number, comment?: string) => {
    const res = await axios.post(`${API_URL}/${id}/rating`, { score, comment });
    return res.data;
  }
};
