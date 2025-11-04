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

  // Don't show navigation on home page and onboarding
  if (pathname === '/' || pathname === '/onboarding') {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 p-2 flex-shrink-0"
    >
      <div className="flex justify-around max-w-sm mx-auto">
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Button
              key={item.path}
              onClick={() => router.push(item.path)}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 p-2 h-auto min-w-0 flex-1 ${
                isActive 
                  ? 'text-purple-400 bg-purple-400/10' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs truncate">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </motion.div>
  );
}