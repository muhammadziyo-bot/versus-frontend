import api from './httpClient';

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
