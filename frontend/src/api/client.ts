import axios, { AxiosError } from 'axios';

export const getApiBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const getAuthToken = () => localStorage.getItem('blueprints_token');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryInterceptor = async (error: AxiosError) => {
  const config = error.config;
  if (!config) return Promise.reject(error);

  const retryCount = (config as any)._retryCount || 0;
  
  if (retryCount < MAX_RETRIES && error.response?.status && [500, 502, 503, 504].includes(error.response.status)) {
    (config as any)._retryCount = retryCount + 1;
    const delay = RETRY_DELAY * Math.pow(2, retryCount);
    await sleep(delay);
    return apiClient(config);
  }
  
  return Promise.reject(error);
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
});

// Add retry interceptor
apiClient.interceptors.response.use(
  (response) => response,
  retryInterceptor
);

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
      localStorage.removeItem('blueprints_token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);
