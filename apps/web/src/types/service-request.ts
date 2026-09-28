export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  categoryId: string;
  subcategoryId?: string;
  title: string;
  description: string;
  addressText?: string;
  city?: string;
  latitude: number;
  longitude: number;
  scheduledDate: string;
  scheduledTime: string;
  budgetMin?: number;
  budgetMax?: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  
  category?: Category;
  subcategory?: Subcategory;
  images?: ServiceRequestImage[];
}

export interface ServiceRequestImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}
