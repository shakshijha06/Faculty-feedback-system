/**
 * services/api.js
 *
 * Axios instance pre-configured for the backend.
 * All components import this rather than raw axios so the base URL
 * is set in one place.
 *
 * The JWT Authorization header is injected by AuthContext.jsx
 * whenever the user logs in.
 */

import axios from 'axios';

const api = axios.create({
  // In development, Vite proxies /api → http://localhost:5000 (see vite.config.js)
  // In production, set VITE_API_URL to the deployed backend URL.
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000, // 10-second timeout
});

// Global response interceptor: surface cleaner error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract backend error message if it exists
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.msg ||
      error.message ||
      'Something went wrong. Please try again.';
    // Replace the raw error with a friendlier one
    return Promise.reject(new Error(message));
  }
);

export default api;
