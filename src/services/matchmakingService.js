import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api';

// Create axios instance for matchmaking
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

class MatchmakingService {
  async joinMatchmaking(debateId, preferences = {}) {
    try {
      const response = await api.post('/matchmaking/join', {
        debate_id: debateId,
        preferences
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to join matchmaking' };
    }
  }

  async leaveMatchmaking() {
    try {
      const response = await api.post('/matchmaking/leave');
      return response.data;
    } catch (error) {
      // Don't throw error for "User not in queue" - this is expected behavior
      if (error.response?.status === 400 && 
          error.response?.data?.detail?.includes('User not in matchmaking queue')) {
        console.log('ℹ️ User already not in queue - this is normal');
        return { message: 'Already left queue' };
      }
      throw error.response?.data || { detail: 'Failed to leave matchmaking' };
    }
  }

  async getQueueStatus() {
    try {
      const response = await api.get('/matchmaking/status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get queue status' };
    }
  }

  async getOnlineUsers() {
    try {
      const response = await api.get('/matchmaking/online');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get online users' };
    }
  }

  async searchUsers(query) {
    try {
      const response = await api.get(`/matchmaking/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to search users' };
    }
  }
}

export default new MatchmakingService();
