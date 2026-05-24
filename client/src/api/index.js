import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to inject JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch API errors and display error toasts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Silence 401 errors for the initial /auth/me verify check, since it runs on boot
    const isAuthMe = error.config?.url?.includes('/auth/me');
    const isUnauthorized = error.response?.status === 401;

    // Suppress toast if caller requested it or if it's a blob request
    // (blob requests handle errors themselves by reading the Blob body)
    const isBlobRequest = error.config?.responseType === 'blob';
    const suppressToast = error.config?.suppressToast;

    // Doctor brief endpoint 403 is handled in the component (shows a nice UI state)
    const isDoctorBrief403 = error.config?.url?.includes('/brief') && error.response?.status === 403;

    if (!(isUnauthorized && isAuthMe) && !isBlobRequest && !suppressToast && !isDoctorBrief403) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
