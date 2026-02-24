// frontend/src/services/api.js
import axios from 'axios';

// Make sure the URL is properly formatted
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

console.log('🔧 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Add timeout
});

// Add request interceptor with debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Log the full URL being called
    console.log('🌐 Full URL:', `${config.baseURL}${config.url}`);
    console.log('🔑 Token present:', !!token);
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout');
    } else if (error.message === 'Network Error') {
      console.error('❌ Network error - Cannot connect to backend');
      console.error('   Make sure Django server is running on http://localhost:8000');
    }
    return Promise.reject(error);
  }
);

export default api;