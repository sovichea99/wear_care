import axios from 'axios';

// Determine base URL based on environment
const getBaseURL = () => {
  return import.meta.env.VITE_API_URL || 'https://laravel-mongodb.onrender.com/api/v1/senji';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;