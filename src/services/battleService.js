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

class BattleService {
  async findUserByUsername(username) {
    try {
      const response = await api.get(`/users/username/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'User not found' };
    }
  }

  async createBattleRoom(battleData) {
    try {
      const response = await api.post('/battles/', battleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create battle room' };
    }
  }

  async getBattleRoom(battleId) {
    try {
      const response = await api.get(`/battles/${battleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch battle room' };
    }
  }

  async startBattle(battleId) {
    try {
      const response = await api.post(`/battles/${battleId}/start`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to start battle' };
    }
  }

  async submitRoundArgument(battleId, argumentData) {
    try {
      const response = await api.post(`/battles/${battleId}/rounds/submit`, argumentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to submit argument' };
    }
  }

  async getBattleRounds(battleId) {
    try {
      const response = await api.get(`/battles/${battleId}/rounds`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch battle rounds' };
    }
  }

  async castVote(battleId, voteData) {
    try {
      const response = await api.post(`/battles/${battleId}/vote`, voteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to cast vote' };
    }
  }

  async getBattleVotes(battleId) {
    try {
      const response = await api.get(`/battles/${battleId}/votes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch battle votes' };
    }
  }

  async getUserBattles(userId, status = null) {
    try {
      const url = status ? `/battles/user/${userId}?status=${status}` : `/battles/user/${userId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch user battles' };
    }
  }

  async getBattleStats() {
    try {
      const response = await api.get('/battles/stats/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch battle stats' };
    }
  }
}

export default new BattleService();
