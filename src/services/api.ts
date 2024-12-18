import axios, { InternalAxiosRequestConfig } from 'axios';
import { Asset, AuthResponse, Session, UsageAnalytics, SharedAsset } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

export const register = (data: RegisterData) => 
  api.post<AuthResponse>('/api/register/', data);

export const login = (data: LoginData) => 
  api.post<AuthResponse>('/api/login/', data);

export const logout = () => 
  api.post('/api/logout/');

// Asset endpoints
interface CreateAssetData {
  name: string;
  description: string;
  subscription_cost: number;
}

export const getAssets = () => 
  api.get<{ data: Asset[] }>('/api/assets/');

export const getSharedAssets = () => 
  api.get<{ data: SharedAsset[] }>('/api/shared-assets/');

export const createAsset = (data: CreateAssetData) => 
  api.post<{ data: Asset }>('/api/assets/', data);

export const updateAsset = (id: number, data: Partial<CreateAssetData>) => 
  api.put<{ data: Asset }>(`/api/assets/${id}/`, data);

export const deleteAsset = (id: number) => 
  api.delete(`/api/assets/${id}/`);

// Asset sharing and management
interface ShareAssetData {
  username: string;
  monthly_hours_allocated: number;
}

export const shareAsset = (assetId: number, data: ShareAssetData) => 
  api.post<{ data: SharedAsset }>(`/api/assets/${assetId}/share/`, data);

export const getSharedAssetDetails = (assetId: number) => 
  api.get<{ data: SharedAsset }>(`/api/shared-assets/?asset=${assetId}`);

export const updateSharedAsset = (sharedAssetId: number, data: { monthly_hours_allocated: number }) => 
  api.put<{ data: SharedAsset }>(`/api/shared-assets/${sharedAssetId}/allocate/`, data);

// Usage and analytics
export const getAssetAnalytics = (assetId: number) => 
  api.get<{ data: UsageAnalytics }>(`/api/shared-assets/${assetId}/analytics/`);

export const getUsageLogs = (assetId: number) => 
  api.get<{ data: Session[] }>(`/api/shared-assets/${assetId}/logs/`);

export const exportAssetReport = (assetId: number) => 
  api.get(`/api/shared-assets/${assetId}/export_report/`, {
    responseType: 'blob'
  });

// Session management
export const startSession = async (assetId: number) => 
  await api.post<{ data: Session }>(`/api/shared-assets/${assetId}/start/`);

export const endSession = async (assetId: number) => 
  await api.post<{ data: Session }>(`/api/shared-assets/${assetId}/end/`);

export const getActiveSession = async (assetId: number) => 
  await api.get<{ data: Session | null }>(`/api/shared-assets/${assetId}/active-session/`);

interface SessionHistoryResponse {
  data: {
    results: Session[];
    count: number;
    next: string | null;
    previous: string | null;
  }
}

export const getSessionHistory = async (assetId: number, page: number = 1) => 
  await api.get<SessionHistoryResponse>(`/api/shared-assets/${assetId}/logs/?page=${page}`);

// Usage Analytics
export const getUsageSummary = async (assetId: number) => 
  await api.get<{ data: UsageAnalytics }>(`/api/shared-assets/${assetId}/usage-summary/`);

export const getUsageAnalytics = async (assetId: number, period: 'daily' | 'weekly' | 'monthly' = 'weekly') => 
  await api.get<{ data: UsageAnalytics }>(`/api/shared-assets/${assetId}/analytics/?period=${period}`);

export default api; 