import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle standard error format
    if (error.response?.data?.error) {
      console.error('API Error:', error.response.data.error.message);
    }
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth_change'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
