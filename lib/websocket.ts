'use client';

import { useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, User } from './types';

class WebSocketManager {
  private socket: Socket | null = null;
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
    if (this.socket?.connected) return;

    this.currentUser = user;
    
    // Socket.IO bağlantısı - Her zaman Render backend'ini kullan
    const socketUrl = 'https://secretchat-fr4o.onrender.com';
    
    console.log('Connecting to Socket.IO server:', socketUrl);
    
    this.socket = io(socketUrl, {
      auth: {
        userId: user.id,
        username: user.username,
        gender: user.gender,
        isPremium: user.isPremium
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected to:', socketUrl);
      console.log('🔗 Socket ID:', this.socket?.id);
      console.log('👤 User:', user.username, user.gender);
      this.isConnected = true;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.isConnected = false;
      this.disconnectCallbacks.forEach(callback => callback());
    });

    // Event listeners
    this.socket.on('message', (message: Message) => {
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('match_found', (data: { chatId: string; user: User }) => {
      console.log('🎉 Match found!', data);
      this.matchCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('match_timeout', () => {
      console.log('⏰ Match timeout - no matches found');
    });

    this.socket.on('match_error', (error) => {
      console.log('❌ Match error:', error);
    });

    this.socket.on('partner_left', () => {
      this.disconnectCallbacks.forEach(callback => callback());
    });

    this.socket.on('friend_request_received', (data) => {
      this.friendRequestCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('friend_request_accepted', (data) => {
      this.friendAcceptedCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('friend_request_rejected', (data) => {
      this.friendRejectedCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('friend_removed', (data) => {
      this.friendRemovedCallbacks.forEach(callback => callback(data));
    });
  }



  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Mesaj gönder
  sendMessage(chatId: string, content: string) {
    console.log('📤 Attempting to send message:', content);
    console.log('🔗 Socket connected:', this.socket?.connected);
    console.log('💬 Chat ID:', chatId);
    
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        chatId,
        content,
        timestamp: Date.now()
      });
      console.log('✅ Message emitted to server');
    } else {
      console.error('❌ Socket not connected, cannot send message');
    }
  }

  // Eşleşme ara
  findMatch(filters: any) {
    console.log('🔍 Finding match with filters:', filters);
    console.log('🔗 Socket connected:', this.socket?.connected);
    
    if (this.socket?.connected) {
      this.socket.emit('find_match', filters);
      console.log('📤 Match request sent');
    } else {
      console.error('❌ Socket not connected, cannot find match');
    }
  }

  // Aramayı iptal et
  cancelMatch() {
    if (this.socket?.connected) {
      this.socket.emit('cancel_match');
    }
  }

  // Chat'e katıl
  joinChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_chat', chatId);
    }
  }

  // Chat'ten ayrıl
  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_chat', chatId);
    }
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
  sendFriendRequest(chatId: string, targetUserId: string, targetUsername: string) {
    if (this.socket?.connected) {
      this.socket.emit('send_friend_request', {
        chatId,
        targetUserId,
        targetUsername
      });
    }
  }

  // Arkadaşlık isteğini kabul et
  acceptFriendRequest(fromUserId: string, fromUsername: string, chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('accept_friend_request', {
        fromUserId,
        fromUsername,
        chatId
      });
    }
  }

  // Arkadaşlık isteğini reddet
  rejectFriendRequest(fromUserId: string, fromUsername: string, chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('reject_friend_request', {
        fromUserId,
        fromUsername,
        chatId
      });
    }
  }

  // Arkadaşı sil
  removeFriend(friendId: string, friendUsername: string) {
    if (this.socket?.connected) {
      this.socket.emit('remove_friend', {
        friendId,
        friendUsername
      });
    }
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
    return this.isConnected && this.socket?.connected === true;
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