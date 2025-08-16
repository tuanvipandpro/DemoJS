import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './tokenStorage';
import { useError } from '../../contexts/ErrorContext';

// Sử dụng proxy từ Vite config thay vì gọi trực tiếp
// Có thể override bằng environment variable VITE_API_BASE
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

let globalShowError = null;

export function bindApiErrorHandler(showError) {
  globalShowError = showError;
}

// Tạo axios instance với cấu hình cơ bản
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
});

// Log API configuration for debugging
console.log('API Client initialized with:', {
  baseURL: API_BASE,
  isProxy: API_BASE === '/api',
  isDirect: API_BASE.startsWith('http')
});

// Interceptor để thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response và refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response for debugging
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase()
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('Token expired, attempting to refresh...');

      try {
        const refresh = getRefreshToken();
        if (!refresh) {
          console.log('No refresh token available');
          clearTokens();
          if (globalShowError) globalShowError('Session expired. Please login again.');
          return Promise.reject(error);
        }

        console.log('Calling refresh token endpoint...');
        const refreshResponse = await axiosInstance.post('/auth/token/refresh', {
          refresh_token: refresh
        });

        if (refreshResponse.data.access_token) {
          console.log('Token refreshed successfully');
          setAccessToken(refreshResponse.data.access_token);
          // Thử lại request gốc với token mới
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
          console.log('Retrying original request with new token');
          return axiosInstance(originalRequest);
        } else {
          console.log('Refresh response missing access_token');
          clearTokens();
          if (globalShowError) globalShowError('Session expired. Please login again.');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
        clearTokens();
        if (globalShowError) globalShowError('Session expired. Please login again.');
        return Promise.reject(error);
      }
    }

    // Xử lý lỗi khác
    if (globalShowError) {
      try {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Request failed';
        globalShowError(errorMessage);
      } catch {
        globalShowError('Request failed');
      }
    }
    
    // Log error details for debugging
    console.error('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data,
      headers: error.response?.headers
    });

    return Promise.reject(error);
  }
);

export const api = {
  post: (path, body) => axiosInstance.post(path, body),
  get: (path) => axiosInstance.get(path),
  put: (path, body) => axiosInstance.put(path, body),
  delete: (path) => axiosInstance.delete(path),
  patch: (path, body) => axiosInstance.patch(path, body),
};


