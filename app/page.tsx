'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, createUser } from '@/lib/storage';
import { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    let currentUser = getUser();
    if (!currentUser) {
      currentUser = createUser();
      // Yeni kullanıcı için onboarding'e yönlendir
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleStartChat = () => {
    router.push('/search');
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <img 
            src="/logo.svg" 
            alt="Secret Chat Logo" 
            className="w-20 h-20"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-white mb-4"
        >
          Secret Chat
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-white/80 mb-8"
        >
          Talk freely and anonymously.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={handleStartChat}
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90 rounded-xl px-8 py-3 text-lg font-semibold shadow-lg"
          >
            Start Chat
          </Button>
        </motion.div>

        {user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-white/60 mt-6"
          >
            Welcome back, {user.username}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
