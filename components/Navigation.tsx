'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Users, Settings } from 'lucide-react';

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
    <div className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 p-3 flex-shrink-0">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => {
                console.log('Navigation clicked:', item.path);
                router.push(item.path);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all min-w-0 flex-1 ${
                isActive 
                  ? 'text-purple-400 bg-purple-400/10' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}