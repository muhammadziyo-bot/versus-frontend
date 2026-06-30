import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if it's a refresh request or already retried
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using a fresh axios instance to avoid interceptor loop
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No token to refresh');
        }
        
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const { access_token } = refreshResponse.data;
        
        // Store new token
        localStorage.setItem('access_token', access_token);
        
        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

class AuthService {
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Registration failed' };
    }
  }

  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Get user info
      const user = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      
      return { access_token, user };
    } catch (error) {
      throw error.response?.data || { detail: 'Login failed' };
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get user info' };
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken() {
    return localStorage.getItem('access_token');
  }

  async validateAndRefreshToken() {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }
      
      // Try to get current user info to validate token
      await this.getCurrentUser();
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return false;
      }
      throw error;
    }
  }

  clearInvalidAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
}

export default new AuthService();
