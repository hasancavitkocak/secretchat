export interface User {
  id: string;
  username: string;
  gender: 'male' | 'female';
  interests: string[];
  isPremium: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  isActive: boolean;
}

export interface Friend {
  id: string;
  username: string;
  addedAt: number;
}

export interface MatchFilters {
  gender?: 'male' | 'female';
  interests: string[];
}

export const INTERESTS = [
  'Music',
  'Sports', 
  'Movies',
  'Gaming',
  'Travel',
  'Books'
] as const;

export const PREMIUM_PLANS = [
  { id: 'daily', name: 'Daily', price: '$2.99', duration: '1 day' },
  { id: 'monthly', name: 'Monthly', price: '$9.99', duration: '30 days' },
  { id: 'yearly', name: 'Yearly', price: '$59.99', duration: '365 days' }
] as const;