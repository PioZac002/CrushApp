// src/api/axiosInstance.js

import axios from 'axios';

const axiosInstance = axios.create({
  // Optionally set baseURL here
  // baseURL: import.meta.env.VITE_API_BASE_URL_USER,
});

// Adding the token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const idToken = localStorage.getItem('id_token');
    if (idToken) {
      config.headers['Authorization'] = `Bearer ${idToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API request error:', error);
    // You can add additional error handling here, e.g., logout on 401 error
    return Promise.reject(error);
  }
);

export default axiosInstance;
