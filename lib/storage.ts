import { User, Chat, Friend } from './types';

const STORAGE_KEYS = {
    USER: 'secret_chat_user',
    CHATS: 'secret_chat_chats',
    FRIENDS: 'secret_chat_friends',
    CURRENT_CHAT: 'secret_chat_current_chat'
} as const;

export function generateUserId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function getUser(): User | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.USER);
        if (!stored) return null;

        return JSON.parse(stored);
    } catch (error) {
        console.error('Error getting user from localStorage:', error);
        return null;
    }
}

export function createUser(): User {
    const user: User = {
        id: generateUserId(),
        username: `Anonymous${Math.floor(Math.random() * 1000)}`,
        gender: 'male',
        interests: [],
        isPremium: false
    };

    saveUser(user);
    return user;
}

export function saveUser(user: User): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
        console.error('Error saving user to localStorage:', error);
    }
}

export function getChats(): Chat[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function saveChats(chats: Chat[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
}

export function getFriends(): Friend[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function saveFriends(friends: Friend[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
}

export function getCurrentChatId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT);
}

export function setCurrentChatId(chatId: string | null): void {
    if (typeof window === 'undefined') return;

    if (chatId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT, chatId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
    }
}

export function clearAllData(): void {
    if (typeof window === 'undefined') return;

    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}