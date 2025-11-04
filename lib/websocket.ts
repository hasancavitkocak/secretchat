'use client';

import { useCallback } from 'react';
import { Message, User } from './types';

class WebSocketManager {
  private eventSource: EventSource | null = null;
  private isConnected = false;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private matchCallbacks: ((data: { chatId: string; user: User }) => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private friendRequestCallbacks: ((data: any) => void)[] = [];
  private friendAcceptedCallbacks: ((data: any) => void)[] = [];
  private friendRejectedCallbacks: ((data: any) => void)[] = [];
  private friendRemovedCallbacks: ((data: any) => void)[] = [];
  private currentUser: User | null = null;

  connect(user: User) {
    if (this.eventSource && this.isConnected) return;

    this.currentUser = user;
    
    // Server-Sent Events bağlantısı
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    this.eventSource = new EventSource(`${baseUrl}/api/socket?userId=${user.id}`);
    
    this.eventSource.onopen = () => {
      console.log('SSE connected');
      this.isConnected = true;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = () => {
      console.log('SSE disconnected');
      this.isConnected = false;
      this.disconnectCallbacks.forEach(callback => callback());
    };

  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'connected':
        console.log('Connected to server');
        break;
      case 'message':
        this.messageCallbacks.forEach(callback => callback(data.message));
        break;
      case 'match_found':
        this.matchCallbacks.forEach(callback => callback(data));
        break;
      case 'match_timeout':
        // Timeout handling
        break;
      case 'partner_left':
        this.disconnectCallbacks.forEach(callback => callback());
        break;
      case 'friend_request_received':
        this.friendRequestCallbacks.forEach(callback => callback(data));
        break;
      case 'friend_request_accepted':
        this.friendAcceptedCallbacks.forEach(callback => callback(data));
        break;
      case 'friend_request_rejected':
        this.friendRejectedCallbacks.forEach(callback => callback(data));
        break;
      case 'friend_removed':
        this.friendRemovedCallbacks.forEach(callback => callback(data));
        break;
    }
  }

  private async apiCall(action: string, data: any = {}) {
    if (!this.currentUser) return;

    try {
      const response = await fetch('/api/socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId: this.currentUser.id,
          data
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      return { error: 'Network error' };
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  // Mesaj gönder
  async sendMessage(chatId: string, content: string) {
    return await this.apiCall('send_message', {
      chatId,
      content,
      timestamp: Date.now()
    });
  }

  // Eşleşme ara
  async findMatch(filters: any) {
    return await this.apiCall('find_match', {
      ...filters,
      user: this.currentUser
    });
  }

  // Aramayı iptal et
  async cancelMatch() {
    return await this.apiCall('cancel_match');
  }

  // Chat'e katıl
  joinChat(chatId: string) {
    // SSE'de otomatik join
    console.log('Joined chat:', chatId);
  }

  // Chat'ten ayrıl
  async leaveChat(chatId: string) {
    return await this.apiCall('leave_chat', { chatId });
  }

  // Event listeners
  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onMatch(callback: (data: { chatId: string; user: User }) => void) {
    this.matchCallbacks.push(callback);
    return () => {
      this.matchCallbacks = this.matchCallbacks.filter(cb => cb !== callback);
    };
  }

  onDisconnect(callback: () => void) {
    this.disconnectCallbacks.push(callback);
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(cb => cb !== callback);
    };
  }

  // Arkadaşlık isteği gönder
  async sendFriendRequest(chatId: string, targetUserId: string, targetUsername: string) {
    return await this.apiCall('send_friend_request', {
      chatId,
      targetUserId,
      targetUsername
    });
  }

  // Arkadaşlık isteğini kabul et
  async acceptFriendRequest(fromUserId: string, fromUsername: string, chatId: string) {
    return await this.apiCall('accept_friend_request', {
      fromUserId,
      fromUsername,
      chatId
    });
  }

  // Arkadaşlık isteğini reddet
  async rejectFriendRequest(fromUserId: string, fromUsername: string, chatId: string) {
    return await this.apiCall('reject_friend_request', {
      fromUserId,
      fromUsername,
      chatId
    });
  }

  // Arkadaşı sil
  async removeFriend(friendId: string, friendUsername: string) {
    return await this.apiCall('remove_friend', {
      friendId,
      friendUsername
    });
  }

  // Event listeners
  onFriendRequest(callback: (data: any) => void) {
    this.friendRequestCallbacks.push(callback);
    return () => {
      this.friendRequestCallbacks = this.friendRequestCallbacks.filter(cb => cb !== callback);
    };
  }

  onFriendAccepted(callback: (data: any) => void) {
    this.friendAcceptedCallbacks.push(callback);
    return () => {
      this.friendAcceptedCallbacks = this.friendAcceptedCallbacks.filter(cb => cb !== callback);
    };
  }

  onFriendRejected(callback: (data: any) => void) {
    this.friendRejectedCallbacks.push(callback);
    return () => {
      this.friendRejectedCallbacks = this.friendRejectedCallbacks.filter(cb => cb !== callback);
    };
  }

  onFriendRemoved(callback: (data: any) => void) {
    this.friendRemovedCallbacks.push(callback);
    return () => {
      this.friendRemovedCallbacks = this.friendRemovedCallbacks.filter(cb => cb !== callback);
    };
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Global instance
export const wsManager = new WebSocketManager();

// React Hook for WebSocket
export function useWebSocket(user: User | null) {
  const connect = useCallback(() => {
    if (user) {
      wsManager.connect(user);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  const sendMessage = useCallback((chatId: string, content: string) => {
    wsManager.sendMessage(chatId, content);
  }, []);

  const findMatch = useCallback((filters: any) => {
    wsManager.findMatch(filters);
  }, []);

  const cancelMatch = useCallback(() => {
    wsManager.cancelMatch();
  }, []);

  const joinChat = useCallback((chatId: string) => {
    wsManager.joinChat(chatId);
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    wsManager.leaveChat(chatId);
  }, []);

  const onMessage = useCallback((callback: (message: Message) => void) => {
    return wsManager.onMessage(callback);
  }, []);

  const onMatch = useCallback((callback: (data: { chatId: string; user: User }) => void) => {
    return wsManager.onMatch(callback);
  }, []);

  const onDisconnect = useCallback((callback: () => void) => {
    return wsManager.onDisconnect(callback);
  }, []);

  const sendFriendRequest = useCallback((chatId: string, targetUserId: string, targetUsername: string) => {
    wsManager.sendFriendRequest(chatId, targetUserId, targetUsername);
  }, []);

  const acceptFriendRequest = useCallback((fromUserId: string, fromUsername: string, chatId: string) => {
    wsManager.acceptFriendRequest(fromUserId, fromUsername, chatId);
  }, []);

  const rejectFriendRequest = useCallback((fromUserId: string, fromUsername: string, chatId: string) => {
    wsManager.rejectFriendRequest(fromUserId, fromUsername, chatId);
  }, []);

  const onFriendRequest = useCallback((callback: (data: any) => void) => {
    return wsManager.onFriendRequest(callback);
  }, []);

  const onFriendAccepted = useCallback((callback: (data: any) => void) => {
    return wsManager.onFriendAccepted(callback);
  }, []);

  const onFriendRejected = useCallback((callback: (data: any) => void) => {
    return wsManager.onFriendRejected(callback);
  }, []);

  const removeFriend = useCallback((friendId: string, friendUsername: string) => {
    wsManager.removeFriend(friendId, friendUsername);
  }, []);

  const onFriendRemoved = useCallback((callback: (data: any) => void) => {
    return wsManager.onFriendRemoved(callback);
  }, []);

  const isConnected = useCallback(() => {
    return wsManager.isSocketConnected();
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    findMatch,
    cancelMatch,
    joinChat,
    leaveChat,
    onMessage,
    onMatch,
    onDisconnect,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    onFriendRequest,
    onFriendAccepted,
    onFriendRejected,
    removeFriend,
    onFriendRemoved,
    isConnected
  };
}