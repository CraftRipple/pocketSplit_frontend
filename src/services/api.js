import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const register = (data) => api.post('/api/register/', data);
export const login = (data) => api.post('/api/login/', data);
export const logout = () => api.post('/api/logout/');

// Asset endpoints
export const getAssets = () => api.get('/api/assets/');
export const getSharedAssets = () => api.get('/api/shared-assets/');
export const createAsset = (data) => api.post('/api/assets/', data);
export const updateAsset = (id, data) => api.put(`/api/assets/${id}/`, data);
export const deleteAsset = (id) => api.delete(`/api/assets/${id}/`);

// Asset sharing and management
export const shareAsset = (assetId, data) => api.post(`/api/assets/${assetId}/share/`, data);
export const getSharedAssetDetails = (assetId) => api.get(`/api/shared-assets/?asset=${assetId}`);
export const updateSharedAsset = (sharedAssetId, data) => api.put(`/api/shared-assets/${sharedAssetId}/allocate/`, data);

// Usage and analytics
export const getAssetAnalytics = (assetId) => api.get(`/api/shared-assets/${assetId}/analytics/`);
export const getUsageLogs = (assetId) => api.get(`/api/shared-assets/${assetId}/logs/`);
export const exportAssetReport = (assetId) => api.get(`/api/shared-assets/${assetId}/export_report/`, {
  responseType: 'blob'
});

// Session management
export const startSession = async (assetId) => {
  return await api.post(`/api/shared-assets/${assetId}/start/`);
};

export const endSession = async (assetId) => {
  return await api.post(`/api/shared-assets/${assetId}/end/`);
};

export const getActiveSession = async (assetId) => {
  return await api.get(`/api/shared-assets/${assetId}/active-session/`);
};

export const getSessionHistory = async (assetId, page = 1) => {
  return await api.get(`/api/shared-assets/${assetId}/logs/?page=${page}`);
};

// Usage Analytics
export const getUsageSummary = async (assetId) => {
  return await api.get(`/api/shared-assets/${assetId}/usage-summary/`);
};

export const getUsageAnalytics = async (assetId, period = 'weekly') => {
  return await api.get(`/api/shared-assets/${assetId}/analytics/?period=${period}`);
};

export default api; 