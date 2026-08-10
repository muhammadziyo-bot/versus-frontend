import api from './httpClient';

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

  async getLeaderboard(period = 'all', skip = 0, limit = 50) {
    try {
      const response = await api.get(`/users/leaderboard?period=${period}&skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch leaderboard' };
    }
  }

  async getUserProfile(username) {
    try {
      const response = await api.get(`/users/username/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch user profile' };
    }
  }
}

export default new UserService();
