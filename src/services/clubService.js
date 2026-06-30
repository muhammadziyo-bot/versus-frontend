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

class ClubService {
  async getClubs(skip = 0, limit = 100) {
    try {
      const response = await api.get(`/clubs?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch clubs' };
    }
  }

  async getClub(clubId) {
    try {
      const response = await api.get(`/clubs/${clubId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch club' };
    }
  }

  async createClub(clubData) {
    try {
      const response = await api.post('/clubs', clubData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create club' };
    }
  }

  async getClubStats() {
    try {
      const response = await api.get('/clubs/stats/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch club stats' };
    }
  }

  async joinClub(clubId) {
    try {
      const response = await api.post(`/clubs/${clubId}/join`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to join club' };
    }
  }

  async leaveClub(clubId) {
    try {
      const response = await api.post(`/clubs/${clubId}/leave`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to leave club' };
    }
  }

  async getClubMembers(clubId) {
    try {
      const response = await api.get(`/clubs/${clubId}/members`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch club members' };
    }
  }

  async getClubDiscussions(clubId) {
    try {
      const response = await api.get(`/clubs/${clubId}/discussions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch club discussions' };
    }
  }

  async createClubDiscussion(clubId, discussionData) {
    try {
      const response = await api.post(`/clubs/${clubId}/discussions`, discussionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create discussion' };
    }
  }

  async createClubComment(clubId, discussionId, commentData) {
    try {
      const response = await api.post(`/clubs/${clubId}/discussions/${discussionId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create comment' };
    }
  }
}

export default new ClubService();
