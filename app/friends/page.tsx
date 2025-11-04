'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getUser, getFriends, saveFriends, getChats, saveChats, setCurrentChatId } from '@/lib/storage';
import { createChatWithMatch } from '@/lib/matching';
import { User, Friend } from '@/lib/types';
import { useRouter } from 'next/navigation';
import FriendCard from '@/components/FriendCard';
import { useWebSocket } from '@/lib/websocket';

export default function FriendsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const router = useRouter();

  // WebSocket hook
  const { 
    connect, 
    disconnect, 
    removeFriend: wsRemoveFriend,
    onFriendRemoved 
  } = useWebSocket(user);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);

    const userFriends = getFriends();
    setFriends(userFriends);
  }, [router]);

  // Separate useEffect for WebSocket
  useEffect(() => {
    if (user) {
      connect();
      return () => {
        disconnect();
      };
    }
  }, [user]); // Only depend on user

  // Arkadaş silindiğinde dinle
  useEffect(() => {
    if (!user) return;

    const unsubscribeFriendRemoved = onFriendRemoved((data: any) => {
      // Karşı taraf beni arkadaşlıktan çıkardı
      setFriends(prevFriends => {
        const updatedFriends = prevFriends.filter(f => f.id !== data.byUserId);
        saveFriends(updatedFriends);
        return updatedFriends;
      });

      // Chat geçmişini de sil
      const chats = getChats();
      const updatedChats = chats.filter(chat => 
        !chat.participants.includes(data.byUserId)
      );
      saveChats(updatedChats);

      alert(`${data.byUsername} removed you from their friends.`);
    });

    return () => {
      unsubscribeFriendRemoved();
    };
  }, [user, onFriendRemoved]); // Remove friends dependency

  const startChatWithFriend = (friend: Friend) => {
    if (!user) return;

    // Create mock user for the friend
    const friendUser: User = {
      id: friend.id,
      username: friend.username,
      gender: 'male', // Default
      interests: [],
      isPremium: false
    };

    // Create new chat
    const newChat = createChatWithMatch(user, friendUser);
    const existingChats = getChats();
    saveChats([...existingChats, newChat]);
    setCurrentChatId(newChat.id);
    
    // Partner bilgisini kaydet
    localStorage.setItem('current_partner', JSON.stringify({
      id: friend.id,
      username: friend.username
    }));
    
    router.push('/chat');
  };

  const deleteFriend = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${friend.username} from your friends? This will delete all chat history.`
    );
    
    if (!confirmed) return;

    // Sadece bu arkadaşı sil
    const updatedFriends = friends.filter(f => f.id !== friendId);
    setFriends(updatedFriends);
    saveFriends(updatedFriends);

    // Bu arkadaşla olan chat geçmişini sil
    const chats = getChats();
    const updatedChats = chats.filter(chat => 
      !chat.participants.includes(friendId)
    );
    saveChats(updatedChats);

    // WebSocket ile karşı tarafa bildir
    wsRemoveFriend(friendId, friend.username);
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-md mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
          <p className="text-white/70">Your connections</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {friends.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <MessageCircle className="w-12 h-12 text-white/50 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No friends yet</h3>
              <p className="text-white/60 text-sm mb-4">
                Start chatting and send friend requests to build your network
              </p>
              <Button
                onClick={() => router.push('/search')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Find People
              </Button>
            </Card>
          ) : (
            friends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FriendCard
                  friend={friend}
                  onChat={() => startChatWithFriend(friend)}
                  onDelete={() => deleteFriend(friend.id)}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Button
            onClick={() => router.push('/search')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Find More People
          </Button>
        </motion.div>
      </div>
    </div>
  );
}