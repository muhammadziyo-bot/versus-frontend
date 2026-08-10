import api from './httpClient';

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

  async getDebateById(debateId) {
    return this.getDebate(debateId);
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
