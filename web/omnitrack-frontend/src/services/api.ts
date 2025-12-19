import axios from 'axios';
import type { Asset, AssetPosition } from '@/types/asset';
import type { Alert, Rule } from '@/types/alert';
import type { Venue, Floor, Zone, POI } from '@/types/venue';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Assets API
export const assetsApi = {
  getAll: (venueId?: string) => 
    api.get<Asset[]>('/assets', { params: { venueId } }),
  
  getById: (id: string) => 
    api.get<Asset>(`/assets/${id}`),
  
  create: (data: Partial<Asset>) => 
    api.post<Asset>('/assets', data),
  
  update: (id: string, data: Partial<Asset>) => 
    api.put<Asset>(`/assets/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/assets/${id}`),
  
  getPosition: (id: string) => 
    api.get<AssetPosition>(`/assets/${id}/position`),
  
  getLivePositions: (venueId: string) => 
    api.get<AssetPosition[]>(`/venues/${venueId}/positions`),
};

// Alerts API
export const alertsApi = {
  getAll: (params?: { status?: string; severity?: string; venueId?: string }) => 
    api.get<Alert[]>('/alerts', { params }),
  
  getById: (id: string) => 
    api.get<Alert>(`/alerts/${id}`),
  
  acknowledge: (id: string) => 
    api.post(`/alerts/${id}/acknowledge`),
  
  resolve: (id: string) => 
    api.post(`/alerts/${id}/resolve`),
};

// Rules API
export const rulesApi = {
  getAll: (venueId?: string) => 
    api.get<Rule[]>('/rules', { params: { venueId } }),
  
  getById: (id: string) => 
    api.get<Rule>(`/rules/${id}`),
  
  create: (data: Partial<Rule>) => 
    api.post<Rule>('/rules', data),
  
  update: (id: string, data: Partial<Rule>) => 
    api.put<Rule>(`/rules/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/rules/${id}`),
  
  toggle: (id: string, enabled: boolean) => 
    api.patch(`/rules/${id}`, { enabled }),
};

// Venues API
export const venuesApi = {
  getAll: () => 
    api.get<Venue[]>('/venues'),
  
  getById: (id: string) => 
    api.get<Venue>(`/venues/${id}`),
  
  create: (data: Partial<Venue>) => 
    api.post<Venue>('/venues', data),
  
  update: (id: string, data: Partial<Venue>) => 
    api.put<Venue>(`/venues/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/venues/${id}`),
  
  getFloors: (venueId: string) => 
    api.get<Floor[]>(`/venues/${venueId}/floors`),
  
  getZones: (venueId: string, floorId?: string) => 
    api.get<Zone[]>(`/venues/${venueId}/zones`, { params: { floorId } }),
  
  getPOIs: (venueId: string) => 
    api.get<POI[]>(`/venues/${venueId}/pois`),
};

// Analytics API
export const analyticsApi = {
  getDwellAnalytics: (venueId: string, startDate: string, endDate: string) => 
    api.get(`/analytics/dwell`, { params: { venueId, startDate, endDate } }),
  
  getHeatmap: (venueId: string, floorId: string, date: string) => 
    api.get(`/analytics/heatmap`, { params: { venueId, floorId, date } }),
  
  getTimeSeries: (venueId: string, metric: string, startDate: string, endDate: string) => 
    api.get(`/analytics/timeseries`, { params: { venueId, metric, startDate, endDate } }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  validateToken: () => 
    api.get('/auth/validate'),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
};

export default api;
