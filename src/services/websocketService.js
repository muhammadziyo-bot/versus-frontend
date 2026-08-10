class WebSocketService {
  constructor() {
    this.connections = new Map(); // battleId -> WebSocket connection
    this.eventListeners = new Map(); // battleId -> Set of callbacks
    this.reconnectConfig = new Map(); // battleId -> { battleId, token, wsUrl }
    this.reconnectAttempts = new Map(); // battleId -> attempt count
    this.reconnectTimers = new Map(); // battleId -> setTimeout id
    this.manuallyClosed = new Set(); // battleIds intentionally closed
  }

  // Open a socket for a battle. `onOpen`/`onError` are optional and only used
  // for the initial (promise-based) connect; reconnects are fire-and-forget.
  _openSocket(config, onOpen, onError) {
    const { battleId, wsUrl } = config;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`Connected to battle ${battleId}`);
      this.connections.set(battleId, ws);
      this.reconnectAttempts.set(battleId, 0);
      if (onOpen) onOpen(ws);
      // Let the UI know we're back (used by auto-reconnect)
      const listeners = this.eventListeners.get(battleId);
      if (listeners) {
        listeners.forEach(cb => {
          try { cb({ type: 'connected' }); } catch (e) { console.error('Connect notify error:', e); }
        });
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(battleId, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for battle ${battleId}:`, error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log(`Disconnected from battle ${battleId}`);
      // Notify listeners before cleanup so the UI can react
      const listeners = this.eventListeners.get(battleId);
      if (listeners) {
        listeners.forEach(cb => {
          try { cb({ type: 'disconnected' }); } catch (e) { console.error('Disconnect notify error:', e); }
        });
      }
      this.connections.delete(battleId);

      if (!this.manuallyClosed.has(battleId)) {
        // Unexpected drop -> auto-reconnect with backoff
        this.scheduleReconnect(battleId);
      } else {
        this.eventListeners.delete(battleId);
        this.reconnectConfig.delete(battleId);
        this.reconnectAttempts.delete(battleId);
        if (this.reconnectTimers.has(battleId)) {
          clearTimeout(this.reconnectTimers.get(battleId));
          this.reconnectTimers.delete(battleId);
        }
        this.manuallyClosed.delete(battleId);
      }
    };

    return ws;
  }

  connectToBattle(battleId, token) {
    return new Promise((resolve, reject) => {
      try {
        const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
        const wsUrl = `${wsBaseUrl}/ws/battle/${battleId}?token=${token}`;
        const config = { battleId, token, wsUrl };
        this.reconnectConfig.set(battleId, config);
        this.manuallyClosed.delete(battleId); // a fresh connect is not a manual close
        this.reconnectAttempts.set(battleId, 0);
        this._openSocket(config, (ws) => resolve(ws), (err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  }

  scheduleReconnect(battleId) {
    const config = this.reconnectConfig.get(battleId);
    if (!config) return; // no config to reconnect with

    const attempts = (this.reconnectAttempts.get(battleId) || 0) + 1;
    this.reconnectAttempts.set(battleId, attempts);

    // Notify the UI that we're attempting to reconnect
    const listeners = this.eventListeners.get(battleId);
    if (listeners) {
      listeners.forEach(cb => {
        try { cb({ type: 'reconnecting', attempt: attempts }); } catch (err) { console.error('Reconnect notify error:', err); }
      });
    }

    // Exponential backoff: 1s, 2s, 4s, 8s ... capped at 30s, max 15 attempts
    if (attempts > 15) {
      console.warn(`Giving up auto-reconnect for battle ${battleId} after ${attempts} attempts`);
      if (listeners) {
        listeners.forEach(cb => {
          try { cb({ type: 'reconnect_failed' }); } catch (err) { console.error('Reconnect failed notify error:', err); }
        });
      }
      this.reconnectConfig.delete(battleId);
      this.reconnectAttempts.delete(battleId);
      if (this.reconnectTimers.has(battleId)) {
        clearTimeout(this.reconnectTimers.get(battleId));
        this.reconnectTimers.delete(battleId);
      }
      return;
    }

    const delay = Math.min(30000, Math.pow(2, attempts - 1) * 1000);

    if (this.reconnectTimers.has(battleId)) {
      clearTimeout(this.reconnectTimers.get(battleId));
    }

    this.reconnectTimers.set(battleId, setTimeout(() => {
      console.log(`Reconnecting battle ${battleId} (attempt ${attempts}) after ${delay}ms`);
      this.reconnectTimers.delete(battleId);
      this._openSocket(config);
    }, delay));
  }

  disconnectFromBattle(battleId) {
    this.manuallyClosed.add(battleId);
    if (this.reconnectTimers.has(battleId)) {
      clearTimeout(this.reconnectTimers.get(battleId));
      this.reconnectTimers.delete(battleId);
    }
    const ws = this.connections.get(battleId);
    if (ws) {
      ws.close();
      this.connections.delete(battleId);
    }
    this.eventListeners.delete(battleId);
    this.reconnectConfig.delete(battleId);
    this.reconnectAttempts.delete(battleId);
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
