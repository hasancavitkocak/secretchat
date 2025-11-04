'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, UserPlus, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUser, getChats, saveChats, getCurrentChatId, setCurrentChatId, getFriends, saveFriends } from '@/lib/storage';
import { User, Chat, Message, Friend } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ChatBubble from '@/components/ChatBubble';
import { useWebSocket } from '@/lib/websocket';
import FriendRequestDialog from '@/components/FriendRequestDialog';

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ username: string; id: string } | null>(null);
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [friendRequestData, setFriendRequestData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // WebSocket hook
  const { 
    connect, 
    disconnect, 
    sendMessage: wsSendMessage, 
    joinChat, 
    leaveChat, 
    onMessage, 
    onDisconnect,
    sendFriendRequest: wsSendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    onFriendRequest,
    onFriendAccepted,
    onFriendRejected,
    isConnected 
  } = useWebSocket(user);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);

    const chatId = getCurrentChatId();
    if (!chatId) {
      router.push('/search');
      return;
    }

    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      router.push('/search');
      return;
    }

    setCurrentChat(chat);

    // Partner bilgisini al
    const partnerData = localStorage.getItem('current_partner');
    if (partnerData) {
      try {
        const partner = JSON.parse(partnerData);
        setPartnerInfo(partner);
      } catch (error) {
        console.error('Error parsing partner data:', error);
      }
    }

    // Check if already friends
    const friends = getFriends();
    const otherUserId = chat.participants.find(id => id !== currentUser.id);
    const isFriend = friends.some(f => f.id === otherUserId);
    setFriendRequestSent(isFriend);

    // Eğer arkadaşsa, friends sayfasına yönlendir
    if (isFriend) {
      router.push('/friends');
      return;
    }

    // Mock mesajlar sadece WebSocket yoksa
    let interval: NodeJS.Timeout | null = null;
    
    // Biraz bekle, WebSocket bağlantısı kurulsun
    setTimeout(() => {
      if (!isConnected()) {
        interval = setInterval(() => {
          if (Math.random() < 0.3 && !isConnected()) { // 30% chance every 3 seconds
            receiveRandomMessage(chat, currentUser.id);
          }
        }, 3000);
      }
    }, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router]);

  // Separate useEffect for WebSocket
  useEffect(() => {
    if (user && currentChat) {
      connect();
      
      // Biraz bekle, bağlantı kurulsun sonra join ol
      setTimeout(() => {
        joinChat(currentChat.id);
        setIsOnline(true);
      }, 500);

      return () => {
        leaveChat(currentChat.id);
        disconnect();
      };
    }
  }, [user, currentChat?.id]); // Only depend on user and chat id

  // WebSocket message listener
  useEffect(() => {
    if (!currentChat) return;

    const unsubscribeMessage = onMessage((newMessage: Message) => {
      // Sadece bu chat'e ait mesajları kabul et
      const chats = getChats();
      const updatedChats = chats.map(c => {
        if (c.id === currentChat.id) {
          return { ...c, messages: [...c.messages, newMessage] };
        }
        return c;
      });

      saveChats(updatedChats);
      setCurrentChat(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
    });

    const unsubscribeDisconnect = onDisconnect(() => {
      setIsOnline(false);
      setPartnerLeft(true);
      // Partner ayrıldı ama chat açık kalsın
      // Arkadaşlık isteği durumunu sıfırla
      setFriendRequestSent(false);
    });

    const unsubscribeFriendRequest = onFriendRequest((data: any) => {
      setFriendRequestData(data);
      setShowFriendRequest(true);
    });

    const unsubscribeFriendAccepted = onFriendAccepted((data: any) => {
      // Arkadaş olarak kaydet
      if (partnerInfo) {
        const newFriend: Friend = {
          id: partnerInfo.id,
          username: partnerInfo.username,
          addedAt: Date.now()
        };

        const friends = getFriends();
        saveFriends([...friends, newFriend]);
        setFriendRequestSent(true);
        
        alert(`${partnerInfo.username} accepted your friend request!`);
        
        // Friends sayfasına yönlendir
        setTimeout(() => {
          router.push('/friends');
        }, 2000);
      }
    });

    const unsubscribeFriendRejected = onFriendRejected((data: any) => {
      alert(`${data.byUsername} declined your friend request.`);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeDisconnect();
      unsubscribeFriendRequest();
      unsubscribeFriendAccepted();
      unsubscribeFriendRejected();
    };
  }, [currentChat, partnerInfo, onMessage, onDisconnect, onFriendRequest, onFriendAccepted, onFriendRejected]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const receiveRandomMessage = (chat: Chat, currentUserId: string) => {
    const otherUserId = chat.participants.find(id => id !== currentUserId);
    if (!otherUserId || chatEnded) return;

    const randomMessages = [
      "Hey there! How's it going?",
      "What are your hobbies?",
      "Nice to meet you!",
      "Where are you from?",
      "What kind of music do you like?",
      "Do you watch any good shows?",
      "What's your favorite movie?",
      "Are you into sports?",
    ];

    const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    
    const newMessage: Message = {
      id: 'msg_' + Date.now(),
      senderId: otherUserId,
      content: randomMessage,
      timestamp: Date.now()
    };

    const chats = getChats();
    const updatedChats = chats.map(c => {
      if (c.id === chat.id) {
        return { ...c, messages: [...c.messages, newMessage] };
      }
      return c;
    });

    saveChats(updatedChats);
    setCurrentChat(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
  };

  const sendMessage = () => {
    if (!message.trim() || !currentChat || !user || chatEnded) return;

    const messageContent = message.trim();
    const newMessage: Message = {
      id: 'msg_' + Date.now(),
      senderId: user.id,
      content: messageContent,
      timestamp: Date.now()
    };

    setMessage('');

    // Her durumda localStorage'a kaydet
    const chats = getChats();
    const updatedChats = chats.map(c => {
      if (c.id === currentChat.id) {
        return { ...c, messages: [...c.messages, newMessage] };
      }
      return c;
    });

    saveChats(updatedChats);
    setCurrentChat({ ...currentChat, messages: [...currentChat.messages, newMessage] });

    // WebSocket ile de gönder
    if (isConnected()) {
      wsSendMessage(currentChat.id, messageContent);
    }
  };

  const sendFriendRequest = () => {
    if (!currentChat || !user || !partnerInfo || friendRequestSent) return;

    if (isConnected()) {
      // WebSocket ile arkadaşlık isteği gönder
      wsSendFriendRequest(currentChat.id, partnerInfo.id, partnerInfo.username);
      setFriendRequestSent(true);
    } else {
      // Fallback: Direkt arkadaş olarak ekle
      const newFriend: Friend = {
        id: partnerInfo.id,
        username: partnerInfo.username,
        addedAt: Date.now()
      };

      const friends = getFriends();
      saveFriends([...friends, newFriend]);
      setFriendRequestSent(true);
    }
  };

  const endChat = () => {
    if (isConnected() && currentChat) {
      // WebSocket ile partner'a bildir
      leaveChat(currentChat.id);
    }
    
    // Partner bilgisini temizle
    localStorage.removeItem('current_partner');
    
    setChatEnded(true);
    setCurrentChatId(null);
    
    setTimeout(() => {
      router.push('/search');
    }, 2000);
  };

  const findNewMatch = () => {
    setCurrentChatId(null);
    router.push('/search');
  };

  const closeChat = () => {
    setCurrentChatId(null);
    router.push('/search');
  };

  const handleAcceptFriend = () => {
    if (!friendRequestData || !currentChat || !partnerInfo) return;

    // Arkadaş olarak kaydet
    const newFriend: Friend = {
      id: friendRequestData.fromUserId,
      username: friendRequestData.fromUsername,
      addedAt: Date.now()
    };

    const friends = getFriends();
    saveFriends([...friends, newFriend]);

    // WebSocket ile kabul bilgisi gönder
    if (isConnected()) {
      acceptFriendRequest(friendRequestData.fromUserId, friendRequestData.fromUsername, currentChat.id);
    }

    // Friends sayfasına yönlendir
    setTimeout(() => {
      router.push('/friends');
    }, 1000);
  };

  const handleRejectFriend = () => {
    if (!friendRequestData || !currentChat) return;

    // WebSocket ile red bilgisi gönder
    if (isConnected()) {
      rejectFriendRequest(friendRequestData.fromUserId, friendRequestData.fromUsername, currentChat.id);
    }
  };

  const goBack = () => {
    if (isConnected() && currentChat) {
      leaveChat(currentChat.id);
    }
    
    localStorage.removeItem('current_partner');
    setCurrentChatId(null);
    router.push('/search');
  };

  if (!user || !currentChat) {
    return <div className="min-h-screen bg-slate-900" />;
  }



  if (chatEnded) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Conversation Closed</h2>
          <p className="text-white/70 mb-6">The chat has ended. Redirecting you back...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            onClick={goBack}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-slate-700 p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-white font-semibold text-sm">
              {partnerInfo ? partnerInfo.username : 'Anonymous Chat'}
            </h2>
            <p className={`text-xs ${isOnline && isConnected() ? 'text-green-400' : partnerLeft ? 'text-red-400' : 'text-white/60'}`}>
              {partnerLeft ? 'Partner left' : (isOnline && isConnected() ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-1">
          {!friendRequestSent && (
            <Button
              onClick={sendFriendRequest}
              variant="outline"
              size="sm"
              className="border-slate-600 text-white hover:bg-slate-700 text-xs px-2"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Add Friend</span>
              <span className="sm:hidden">+</span>
            </Button>
          )}
          
          <Button
            onClick={endChat}
            variant="destructive"
            size="sm"
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {currentChat.messages.length === 0 ? (
          <div className="text-center text-white/50 mt-8">
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          currentChat.messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-800 border-t border-slate-700 p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-white/50 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-purple-600 hover:bg-purple-700 p-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <FriendRequestDialog
        open={showFriendRequest}
        onOpenChange={setShowFriendRequest}
        fromUsername={friendRequestData?.fromUsername || ''}
        onAccept={handleAcceptFriend}
        onReject={handleRejectFriend}
      />
    </div>
  );
}