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

class DebateService {
  async getDebates(skip = 0, limit = 100) {
    try {
      const response = await api.get(`/debates?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch debates' };
    }
  }

  async getDebate(debateId) {
    try {
      const response = await api.get(`/debates/${debateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch debate' };
    }
  }

  async createDebate(debateData) {
    try {
      const response = await api.post('/debates', debateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create debate' };
    }
  }

  async getDebateStats() {
    try {
      const response = await api.get('/debates/stats/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch debate stats' };
    }
  }

  async createArgument(debateId, argumentData) {
    try {
      const response = await api.post(`/debates/${debateId}/arguments`, argumentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create argument' };
    }
  }
}

export default new DebateService();
