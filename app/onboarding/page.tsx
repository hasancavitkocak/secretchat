'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { saveUser } from '@/lib/storage';
import { User as UserType } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface OnboardingPageProps {
  user: UserType;
}

export default function OnboardingPage() {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };

  const handleContinue = () => {
    if (!selectedGender) return;

    setIsLoading(true);

    // Get user from localStorage and update gender
    const userStr = localStorage.getItem('secret_chat_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, gender: selectedGender };
        saveUser(updatedUser);
        
        setTimeout(() => {
          router.push('/search');
        }, 500);
      } catch (error) {
        console.error('Error updating user:', error);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
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
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
            <Users className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-white mb-4"
        >
          Welcome to Secret Chat
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/80 mb-8"
        >
          Please select your gender to get started
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4 mb-8"
        >
          <Card 
            className={`p-6 cursor-pointer transition-all duration-200 ${
              selectedGender === 'male' 
                ? 'bg-purple-600/20 border-purple-500' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            onClick={() => handleGenderSelect('male')}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                selectedGender === 'male' ? 'bg-purple-600' : 'bg-white/10'
              }`}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Male</h3>
                <p className="text-white/60 text-sm">Connect with people</p>
              </div>
            </div>
          </Card>

          <Card 
            className={`p-6 cursor-pointer transition-all duration-200 ${
              selectedGender === 'female' 
                ? 'bg-purple-600/20 border-purple-500' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            onClick={() => handleGenderSelect('female')}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                selectedGender === 'female' ? 'bg-purple-600' : 'bg-white/10'
              }`}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Female</h3>
                <p className="text-white/60 text-sm">Connect with people</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={handleContinue}
            disabled={!selectedGender || isLoading}
            size="lg"
            className="w-full bg-white text-slate-900 hover:bg-white/90 rounded-xl py-3 text-lg font-semibold shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-white/50 text-sm mt-6"
        >
          You can change this later in settings
        </motion.p>
      </motion.div>
    </div>
  );
}