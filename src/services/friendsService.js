import api from './httpClient';

class FriendsService {
  async searchUsers(query) {
    try {
      const response = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to search users' };
    }
  }

  async sendFriendRequest(receiverId, message = null) {
    try {
      const response = await api.post('/friends/request', {
        receiver_id: receiverId,
        message: message
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to send friend request' };
    }
  }

  async getSentRequests() {
    try {
      const response = await api.get('/friends/requests/sent');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get sent requests' };
    }
  }

  async getReceivedRequests() {
    try {
      const response = await api.get('/friends/requests/received');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get received requests' };
    }
  }

  async acceptFriendRequest(requestId) {
    try {
      const response = await api.post(`/friends/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to accept friend request' };
    }
  }

  async rejectFriendRequest(requestId) {
    try {
      const response = await api.post(`/friends/requests/${requestId}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to reject friend request' };
    }
  }

  async getFriends() {
    try {
      const response = await api.get('/friends');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get friends' };
    }
  }

  async removeFriend(friendId) {
    try {
      const response = await api.delete(`/friends/${friendId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to remove friend' };
    }
  }
}

export default new FriendsService();
