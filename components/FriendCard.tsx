'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Friend } from '@/lib/types';

interface FriendCardProps {
  friend: Friend;
  onChat: () => void;
  onDelete: () => void;
}

export default function FriendCard({ friend, onChat, onDelete }: FriendCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${friend.username} from your friends? This will delete all chat history.`
    );
    
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600/20 rounded-full p-2">
            <User className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">{friend.username}</h3>
            <p className="text-white/60 text-sm">
              Added {formatDate(friend.addedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onChat}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Chat
          </Button>
          
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}