import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api';

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

class UserService {
  async getTopDebaters(skip = 0, limit = 50) {
    try {
      const response = await api.get(`/users/debaters?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch debaters' };
    }
  }

  async getUserStats() {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch user stats' };
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update profile' };
    }
  }

  async updateSettings(settings) {
    try {
      const response = await api.put('/users/settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update settings' };
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await api.put('/users/password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to change password' };
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch current user' };
    }
  }

  async linkTelegram(payload) {
    try {
      const response = await api.post('/users/telegram/link', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to link Telegram account' };
    }
  }

  async unlinkTelegram() {
    try {
      const response = await api.delete('/users/telegram/unlink');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to unlink Telegram account' };
    }
  }

  async uploadAvatar(formData) {
    try {
      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to upload profile picture' };
    }
  }
}

export default new UserService();
