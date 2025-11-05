'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, MessageCircle, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Users, label: 'Friends', path: '/friends' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show navigation on home page, onboarding, and chat page
  if (pathname === '/' || pathname === '/onboarding' || pathname === '/chat') {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="bottom-navigation bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 p-2 flex-shrink-0 safe-area-inset-bottom"
      style={{ 
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50
      }}
    >
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Button
              key={item.path}
              onClick={() => router.push(item.path)}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 p-3 h-auto min-w-0 flex-1 rounded-lg transition-all ${
                isActive 
                  ? 'text-purple-400 bg-purple-400/10 scale-105' 
                  : 'text-white/60 hover:text-white hover:bg-white/5 hover:scale-105'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </motion.div>
  );
}