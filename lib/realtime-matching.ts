import { User, MatchFilters, Chat } from './types';
import { generateUserId } from './storage';

// Simulated matching queue - gerçek uygulamada bu backend'de olacak
interface MatchingUser {
  user: User;
  filters: MatchFilters;
  timestamp: number;
}

class MatchingQueue {
  private queue: MatchingUser[] = [];
  private matchCallbacks: Map<string, (match: User | null) => void> = new Map();

  addToQueue(user: User, filters: MatchFilters): Promise<User | null> {
    return new Promise((resolve) => {
      // Önce mevcut kuyruktaki uyumlu kullanıcıları kontrol et
      const compatibleMatch = this.findCompatibleMatch(user, filters);
      
      if (compatibleMatch) {
        // Eşleşme bulundu, kuyruktan çıkar
        this.removeFromQueue(compatibleMatch.user.id);
        
        // Callback'i çağır
        const callback = this.matchCallbacks.get(compatibleMatch.user.id);
        if (callback) {
          callback(user);
          this.matchCallbacks.delete(compatibleMatch.user.id);
        }
        
        resolve(compatibleMatch.user);
      } else {
        // Eşleşme bulunamadı, kuyruğa ekle
        this.queue.push({
          user,
          filters,
          timestamp: Date.now()
        });
        
        // Callback'i kaydet
        this.matchCallbacks.set(user.id, resolve);
        
        // 30 saniye sonra timeout
        setTimeout(() => {
          if (this.matchCallbacks.has(user.id)) {
            this.removeFromQueue(user.id);
            this.matchCallbacks.delete(user.id);
            resolve(null); // Timeout - eşleşme bulunamadı
          }
        }, 30000);
      }
    });
  }

  private findCompatibleMatch(user: User, filters: MatchFilters): MatchingUser | null {
    for (const queuedUser of this.queue) {
      if (this.areCompatible(user, filters, queuedUser.user, queuedUser.filters)) {
        return queuedUser;
      }
    }
    return null;
  }

  private areCompatible(
    user1: User, 
    filters1: MatchFilters, 
    user2: User, 
    filters2: MatchFilters
  ): boolean {
    // Aynı kullanıcı olamaz
    if (user1.id === user2.id) return false;

    // Premium kontrolü - erkek kullanıcı kadın arıyorsa premium gerekli
    if (user1.gender === 'male' && filters1.gender === 'female' && !user1.isPremium) {
      return false;
    }
    if (user2.gender === 'male' && filters2.gender === 'female' && !user2.isPremium) {
      return false;
    }

    // Cinsiyet uyumluluğu
    if (filters1.gender && filters1.gender !== user2.gender) return false;
    if (filters2.gender && filters2.gender !== user1.gender) return false;

    // İlgi alanı uyumluluğu (en az bir ortak ilgi)
    if (filters1.interests.length > 0 || filters2.interests.length > 0) {
      const user1Interests = user1.interests;
      const user2Interests = user2.interests;
      const filter1Interests = filters1.interests;
      const filter2Interests = filters2.interests;

      // User1'in filtreleri user2'nin ilgileriyle uyumlu mu?
      if (filter1Interests.length > 0) {
        const hasCommon1 = filter1Interests.some(interest => 
          user2Interests.includes(interest)
        );
        if (!hasCommon1) return false;
      }

      // User2'nin filtreleri user1'in ilgileriyle uyumlu mu?
      if (filter2Interests.length > 0) {
        const hasCommon2 = filter2Interests.some(interest => 
          user1Interests.includes(interest)
        );
        if (!hasCommon2) return false;
      }
    }

    return true;
  }

  private removeFromQueue(userId: string): void {
    this.queue = this.queue.filter(item => item.user.id !== userId);
  }

  removeUser(userId: string): void {
    this.removeFromQueue(userId);
    const callback = this.matchCallbacks.get(userId);
    if (callback) {
      callback(null);
      this.matchCallbacks.delete(userId);
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  // Eski girişleri temizle (5 dakikadan eski)
  cleanup(): void {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    this.queue = this.queue.filter(item => {
      if (item.timestamp < fiveMinutesAgo) {
        // Timeout callback'ini çağır
        const callback = this.matchCallbacks.get(item.user.id);
        if (callback) {
          callback(null);
          this.matchCallbacks.delete(item.user.id);
        }
        return false;
      }
      return true;
    });
  }
}

// Global matching queue instance
const matchingQueue = new MatchingQueue();

// Periyodik temizlik
setInterval(() => {
  matchingQueue.cleanup();
}, 60000); // Her dakika

export function findRealtimeMatch(user: User, filters: MatchFilters): Promise<User | null> {
  // Premium kontrolü
  if (user.gender === 'male' && filters.gender === 'female' && !user.isPremium) {
    throw new Error('PREMIUM_REQUIRED');
  }

  return matchingQueue.addToQueue(user, filters);
}

export function cancelMatching(userId: string): void {
  matchingQueue.removeUser(userId);
}

export function getQueueSize(): number {
  return matchingQueue.getQueueSize();
}

export function createChatWithMatch(currentUser: User, matchedUser: User): Chat {
  return {
    id: 'chat_' + Math.random().toString(36).substring(2, 11),
    participants: [currentUser.id, matchedUser.id],
    messages: [],
    isActive: true
  };
}