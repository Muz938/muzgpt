
export type AIMode = 'general' | 'student' | 'game' | 'startup';
export type UserTier = 'free' | 'premium';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  mode?: AIMode;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mode: AIMode;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: number;
  completedTasks: number;
  selectedMode: AIMode;
  tier: UserTier;
  dailyUsage: number;
  lastUsageReset: string; // ISO date string
  isLoggedIn: boolean;
}

export interface XPEvent {
  amount: number;
  reason: string;
  id: string;
}
