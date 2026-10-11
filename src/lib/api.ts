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

  // If response contains data
  const errData = error.response?.data;
  if (errData) {
    if (typeof errData.error === 'string') {
      return errData.error;
    }
    if (typeof errData.error === 'object' && errData.error !== null) {
      if (typeof errData.error.message === 'string') {
        return errData.error.message;
      }
      if (typeof errData.error.code === 'string') {
        return `Error: ${errData.error.code}`;
      }
      return JSON.stringify(errData.error);
    }
    if (typeof errData.message === 'string') {
      return errData.message;
    }
    if (typeof errData === 'string') {
      return errData;
    }
  }

  // If 401 Unauthorized
  if (error.response?.status === 401) {
    return 'Invalid credentials. Please verify your email and password.';
  }

  // If 403 Forbidden
  if (error.response?.status === 403) {
    return 'Access denied. Account is restricted.';
  }

  // If 404 Not Found
  if (error.response?.status === 404) {
    return 'The requested resource or endpoint was not found.';
  }

  // If 500 Internal Server Error
  if (error.response?.status >= 500) {
    return 'Server error. Please try again in a few moments.';
  }

  // If standard Axios error message
  if (typeof error.message === 'string') {
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
