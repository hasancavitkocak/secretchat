'use client';

import { motion } from 'framer-motion';
import { Message } from '@/lib/types';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-1`}
    >
      <div
        className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl break-words ${
          isOwn
            ? 'bg-purple-600 text-white rounded-br-md'
            : 'bg-slate-700 text-white rounded-bl-md'
        }`}
      >
        <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
        <p className={`text-xs mt-1 ${
          isOwn ? 'text-purple-200' : 'text-slate-400'
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}