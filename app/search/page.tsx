'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, saveUser, getChats, saveChats, setCurrentChatId } from '@/lib/storage';
import { findRealtimeMatch, cancelMatching, createChatWithMatch } from '@/lib/realtime-matching';
import { User, MatchFilters } from '@/lib/types';
import { useRouter } from 'next/navigation';
import FilterModal from '@/components/FilterModal';
import PremiumDialog from '@/components/PremiumDialog';
import { useWebSocket } from '@/lib/websocket';

export default function SearchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<MatchFilters>({ interests: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const router = useRouter();
  
  // WebSocket hook
  const { 
    connect, 
    disconnect, 
    findMatch: wsFindMatch, 
    cancelMatch, 
    onMatch,
    isConnected 
  } = useWebSocket(user);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Separate useEffect for WebSocket connection
  useEffect(() => {
    if (user) {
      connect();
      return () => {
        disconnect();
      };
    }
  }, [user]); // Only depend on user, not the functions

  // WebSocket match listener
  useEffect(() => {
    if (!user) return;

    const unsubscribeMatch = onMatch((data: { chatId: string; user: User }) => {
      setIsSearching(false);
      
      // WebSocket'ten gelen chatId'yi kullan
      const newChat = {
        id: data.chatId,
        participants: [user.id, data.user.id],
        messages: [],
        isActive: true
      };
      
      const existingChats = getChats();
      saveChats([...existingChats, newChat]);
      setCurrentChatId(data.chatId);
      
      // Partner bilgisini kaydet
      localStorage.setItem('current_partner', JSON.stringify({
        id: data.user.id,
        username: data.user.username
      }));
      
      router.push('/chat');
    });

    return () => {
      unsubscribeMatch();
    };
  }, [user, onMatch, router]);

  const handleFindMatch = async () => {
    if (!user) return;

    // Premium kontrolü
    if (user.gender === 'male' && filters.gender === 'female' && !user.isPremium) {
      setShowPremiumDialog(true);
      return;
    }

    setIsSearching(true);

    try {
      if (isConnected()) {
        // WebSocket ile eşleşme ara
        wsFindMatch(filters);
        
        // 30 saniye timeout
        setTimeout(() => {
          if (isSearching) {
            setIsSearching(false);
            alert('No matches found. Please try again or adjust your filters.');
          }
        }, 30000);
      } else {
        // Fallback: Eski sistem
        const match = await findRealtimeMatch(user, filters);
        
        if (match) {
          const newChat = createChatWithMatch(user, match);
          const existingChats = getChats();
          saveChats([...existingChats, newChat]);
          setCurrentChatId(newChat.id);
          
          router.push('/chat');
        } else {
          alert('No matches found. Please try again or adjust your filters.');
        }
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Error finding match:', error);
      alert('Error finding match. Please try again.');
      setIsSearching(false);
    }
  };

  const handleCancelSearch = () => {
    if (!user) return;
    
    if (isConnected()) {
      cancelMatch();
    } else {
      cancelMatching(user.id);
    }
    setIsSearching(false);
  };

  const handlePremiumUpgrade = (planId: string) => {
    if (!user) return;
    
    // Mock premium upgrade
    const updatedUser = { ...user, isPremium: true };
    setUser(updatedUser);
    saveUser(updatedUser);
    setShowPremiumDialog(false);
    
    // Auto-search after upgrade
    handleFindMatch();
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>;
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 overflow-y-auto">
      <div className="max-w-md mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Find Your Match</h1>
          <p className="text-white/70">Connect with someone new</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {isSearching ? (
            <Button
              onClick={handleCancelSearch}
              variant="destructive"
              className="w-full rounded-xl py-6 text-lg font-semibold shadow-lg"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel Search
            </Button>
          ) : (
            <Button
              onClick={handleFindMatch}
              className="w-full bg-white text-slate-900 hover:bg-white/90 rounded-xl py-6 text-lg font-semibold shadow-lg"
            >
              <Search className="w-5 h-5 mr-2" />
              Find Match
            </Button>
          )}

          {isSearching && (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
              <p className="text-white/70">Looking for someone to chat with...</p>
              <p className="text-white/50 text-sm">This may take up to 30 seconds</p>
            </div>
          )}

          <Button
            onClick={() => setShowFilterModal(true)}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl py-6 text-lg"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {(filters.gender || filters.interests.length > 0) && (
              <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                {[filters.gender, ...filters.interests].filter(Boolean).length}
              </span>
            )}
          </Button>

          {/* Test için mock eşleşme */}
          <Button
            onClick={() => {
              const mockChatId = `test_chat_${Date.now()}`;
              const mockPartner = {
                id: 'test_user_123',
                username: 'TestUser',
                gender: user?.gender === 'male' ? 'female' : 'male',
                interests: [],
                isPremium: false
              };
              
              const newChat = {
                id: mockChatId,
                participants: [user!.id, mockPartner.id],
                messages: [],
                isActive: true
              };
              
              const existingChats = getChats();
              saveChats([...existingChats, newChat]);
              setCurrentChatId(mockChatId);
              
              localStorage.setItem('current_partner', JSON.stringify({
                id: mockPartner.id,
                username: mockPartner.username
              }));
              
              router.push('/chat');
            }}
            variant="secondary"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl py-4"
          >
            🧪 Test Chat
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-white/60 text-sm">
            Hello, {user.username}
            {user.isPremium && (
              <span className="ml-2 bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
                Premium
              </span>
            )}
          </p>
        </motion.div>
      </div>

      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <PremiumDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
        onUpgrade={handlePremiumUpgrade}
      />
    </div>
  );
}