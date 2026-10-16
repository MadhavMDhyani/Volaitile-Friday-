import axios from 'axios';

const isProduction = import.meta.env.PROD;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (isProduction && !apiBaseUrl) {
  throw new Error('App is not configured');
}

const axiosInstance = axios.create({
  baseURL: apiBaseUrl || 'http://localhost:3000',
});

let onUnauthorizedCallback = null;

export const setUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

// Dynamically attach the token on every request instead of once at module load
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 for any request except login and register,
// clear the token and notify via registered callback
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/users/login') || requestUrl.includes('/users/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];

      if (typeof onUnauthorizedCallback === 'function') {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export default axiosInstance;