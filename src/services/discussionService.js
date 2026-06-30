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

class DiscussionService {
  async getDiscussions(skip = 0, limit = 100, sortBy = 'hot') {
    try {
      const response = await api.get(`/discussions?skip=${skip}&limit=${limit}&sort=${sortBy}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch discussions' };
    }
  }

  async getDiscussionStats() {
    try {
      const response = await api.get('/discussions/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch discussion stats' };
    }
  }

  async createDiscussion(discussionData) {
    try {
      const response = await api.post('/discussions/', discussionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create discussion' };
    }
  }

  async getDiscussionById(discussionId) {
    try {
      const response = await api.get(`/discussions/${discussionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch discussion' };
    }
  }

  async voteDiscussion(discussionId, voteType) {
    try {
      const response = await api.post(`/discussions/${discussionId}/vote`, { vote_type: voteType });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to vote on discussion' };
    }
  }

  async addComment(discussionId, content, parentId = null) {
    try {
      const response = await api.post(`/discussions/${discussionId}/comments`, {
        content,
        parent_id: parentId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to add comment' };
    }
  }

  async voteComment(commentId, voteType) {
    try {
      const response = await api.post(`/comments/${commentId}/vote`, { vote_type: voteType });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to vote on comment' };
    }
  }

  async bookmarkDiscussion(discussionId) {
    try {
      const response = await api.post(`/discussions/${discussionId}/bookmark`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to bookmark discussion' };
    }
  }

  async reportDiscussion(discussionId, reason) {
    try {
      const response = await api.post(`/discussions/${discussionId}/report`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to report discussion' };
    }
  }
}

export default new DiscussionService();
