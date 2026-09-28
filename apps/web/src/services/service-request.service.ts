import axios from 'axios';
const api = axios.create({ baseURL: '/api', withCredentials: true });
import { ServiceRequest } from '../types/service-request';

export interface CreateServiceRequestPayload {
  categoryId: string;
  subcategoryId?: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addressText?: string;
  scheduledDate: string;
  scheduledTime: string;
  budgetMin?: number;
  budgetMax?: number;
  imageUrls?: string[];
}

export const ServiceRequestService = {
  create: async (data: CreateServiceRequestPayload): Promise<ServiceRequest> => {
    const response = await api.post('/service-requests', data);
    return response.data;
  },

  getMyRequests: async (): Promise<ServiceRequest[]> => {
    const response = await api.get('/service-requests/me');
    return response.data;
  },

  getById: async (id: string): Promise<ServiceRequest> => {
    const response = await api.get(`/service-requests/${id}`);
    return response.data;
  },

  cancel: async (id: string, reason?: string): Promise<ServiceRequest> => {
    const response = await api.post(`/service-requests/${id}/cancel`, { reason });
    return response.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },

  getOffers: async (id: string): Promise<any[]> => {
    const response = await api.get(`/service-requests/${id}/offers`);
    return response.data;
  },

  selectTechnician: async (serviceRequestId: string, technicianId: string): Promise<any> => {
    const response = await api.post(`/service-requests/${serviceRequestId}/select-technician`, { technicianId });
    return response.data;
  }
};
