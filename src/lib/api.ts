import axios from 'axios';

// Centralized Axios client for Kunda Space API
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Automatically inject JWT token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kunda_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Extracts a human-friendly error string from Axios or network errors
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';

  // If response contains structured JSON error from Kunda API
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // If 401 Unauthorized
  if (error.response?.status === 401) {
    return 'Invalid credentials. Please verify your email and password.';
  }

  // If 403 Forbidden
  if (error.response?.status === 403) {
    return error.response?.data?.error || 'Access denied. Account is restricted.';
  }

  // If 404 Not Found
  if (error.response?.status === 404) {
    return 'The requested resource or endpoint was not found.';
  }

  // If standard Axios error message
  if (error.message) {
    if (error.message.includes('Network Error')) {
      return 'Unable to reach the server. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
