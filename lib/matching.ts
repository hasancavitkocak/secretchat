import { User, MatchFilters, Chat } from './types';
import { generateUserId } from './storage';

// Mock users for matching simulation
const MOCK_USERS: Omit<User, 'id'>[] = [
  { username: 'MusicLover23', gender: 'female', interests: ['Music', 'Movies'], isPremium: false },
  { username: 'SportsFan88', gender: 'male', interests: ['Sports', 'Gaming'], isPremium: false },
  { username: 'BookWorm42', gender: 'female', interests: ['Books', 'Travel'], isPremium: false },
  { username: 'GamerGirl', gender: 'female', interests: ['Gaming', 'Movies'], isPremium: false },
  { username: 'TravelBuddy', gender: 'male', interests: ['Travel', 'Music'], isPremium: false },
  { username: 'MovieBuff', gender: 'female', interests: ['Movies', 'Books'], isPremium: false },
];

export function findMatch(currentUser: User, filters: MatchFilters): User | null {
  // Check if male user trying to match with female without premium
  if (currentUser.gender === 'male' && filters.gender === 'female' && !currentUser.isPremium) {
    throw new Error('PREMIUM_REQUIRED');
  }

  // Filter mock users based on criteria
  const availableUsers = MOCK_USERS.filter(mockUser => {
    // Gender filter
    if (filters.gender && mockUser.gender !== filters.gender) {
      return false;
    }

    // Interest filter (at least one common interest)
    if (filters.interests.length > 0) {
      const hasCommonInterest = filters.interests.some(interest => 
        mockUser.interests.includes(interest)
      );
      if (!hasCommonInterest) {
        return false;
      }
    }

    return true;
  });

  if (availableUsers.length === 0) {
    return null;
  }

  // Return random match
  const randomIndex = Math.floor(Math.random() * availableUsers.length);
  const selectedUser = availableUsers[randomIndex];
  
  return {
    ...selectedUser,
    id: generateUserId()
  };
}

export function createChatWithMatch(currentUser: User, matchedUser: User): Chat {
  return {
    id: 'chat_' + Math.random().toString(36).substr(2, 9),
    participants: [currentUser.id, matchedUser.id],
    messages: [],
    isActive: true
  };
}