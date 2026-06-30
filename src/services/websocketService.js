class WebSocketService {
  constructor() {
    this.connections = new Map(); // battleId -> WebSocket connection
    this.eventListeners = new Map(); // battleId -> Set of callbacks
  }

  connectToBattle(battleId, token) {
    return new Promise((resolve, reject) => {
      try {
        const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
        const wsUrl = `${wsBaseUrl}/ws/battle/${battleId}?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(`Connected to battle ${battleId}`);
          this.connections.set(battleId, ws);
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for battle ${battleId}:`, error);
          reject(error);
        };

        ws.onclose = () => {
          console.log(`Disconnected from battle ${battleId}`);
          this.connections.delete(battleId);
          this.eventListeners.delete(battleId);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(battleId, data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnectFromBattle(battleId) {
    const ws = this.connections.get(battleId);
    if (ws) {
      ws.close();
      this.connections.delete(battleId);
      this.eventListeners.delete(battleId);
    }
  }

  sendMessage(battleId, message) {
    const ws = this.connections.get(battleId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`No active connection for battle ${battleId}`);
    }
  }

  addEventListener(battleId, callback) {
    if (!this.eventListeners.has(battleId)) {
      this.eventListeners.set(battleId, new Set());
    }
    this.eventListeners.get(battleId).add(callback);
  }

  removeEventListener(battleId, callback) {
    const listeners = this.eventListeners.get(battleId);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  handleMessage(battleId, data) {
    const listeners = this.eventListeners.get(battleId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  // Battle-specific message methods
  sendChatMessage(battleId, message) {
    this.sendMessage(battleId, {
      type: 'chat',
      data: {
        message: message
      }
    });
  }

  submitArgument(battleId, roundNumber, argument) {
    this.sendMessage(battleId, {
      type: 'submit_argument',
      data: {
        round_number: roundNumber,
        argument: argument
      }
    });
  }

  startBattle(battleId) {
    this.sendMessage(battleId, {
      type: 'start_battle'
    });
  }

  sendHeartbeat(battleId) {
    this.sendMessage(battleId, {
      type: 'heartbeat'
    });
  }

  requestBattleState(battleId) {
    this.sendMessage(battleId, {
      type: 'get_battle_state'
    });
  }

  getConnectionStatus(battleId) {
    const ws = this.connections.get(battleId);
    if (!ws) return 'disconnected';
    
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // Disconnect all connections
  disconnectAll() {
    this.connections.forEach((ws, battleId) => {
      this.disconnectFromBattle(battleId);
    });
  }
}

export default new WebSocketService();
