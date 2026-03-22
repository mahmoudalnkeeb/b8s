import axios from 'axios';

export const getApiBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const getAuthToken = () => localStorage.getItem('blueprints_token');

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
});

// Add a request interceptor to inject the auth token
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login or clear token)
      localStorage.removeItem('blueprints_token');
    }
    return Promise.reject(error);
  },
);
