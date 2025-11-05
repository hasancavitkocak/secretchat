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

  // Don't show navigation on home page, onboarding, and chat page
  if (pathname === '/' || pathname === '/onboarding' || pathname === '/chat') {
    return null;
  }

  return (
    <div className="bottom-nav">
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
              className={`nav-button ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}