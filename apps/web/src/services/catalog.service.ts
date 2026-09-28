import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
import { Category, Subcategory } from '../types/service-request';

export const CatalogService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getSubcategories: async (categoryId: string): Promise<Subcategory[]> => {
    const response = await api.get(`/categories/${categoryId}/subcategories`);
    return response.data;
  },
};
