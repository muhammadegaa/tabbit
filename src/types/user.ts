// User and Subscription Type Definitions for TabMind

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  subscription: SubscriptionPlan;
  createdAt: Date;
  lastActive: Date;
  preferences: UserPreferences;
  usage: UsageStats;
}

export type SubscriptionPlan = 'free' | 'pro' | 'team';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    goalReminders: boolean;
    automationAlerts: boolean;
    progressChecks: boolean;
  };
  automation: {
    autoCloseDiscard: boolean;
    autoPinReference: boolean;
    autoGroupLater: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    allowTeamSharing: boolean;
  };
}

export interface UsageStats {
  tabAnalyses: number;
  dailyGoals: number;
  automationActions: number;
  lastResetDate: Date;
}

export interface Goal {
  id: string;
  userId: string;
  content: string;
  outcome?: string;
  minimum?: string;
  createdAt: Date;
  completed: boolean;
  archived: boolean;
  teamGoalId?: string; // Reference to shared team goal
}

export interface TabAnalysis {
  id: string;
  userId: string;
  goalId: string;
  tabInfo: {
    title: string;
    url: string;
    snippet?: string;
  };
  decision: 'do_now' | 'do_later' | 'delegate' | 'reference' | 'discard';
  confidence: number;
  reasoning: string;
  timestamp: Date;
  project?: string;
  nextAction?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  usage: UsageStats;
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  tabAnalysesPerDay: number;
  goalsPerDay: number;
  teamMembers: number;
  historyRetention: number; // days
}

export interface TeamGoal {
  id: string;
  teamId: string;
  ownerId: string;
  content: string;
  description?: string;
  createdAt: Date;
  members: string[]; // Array of user IDs
  isActive: boolean;
}

// Constants for subscription limits
export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    tabAnalysesPerDay: 1, // Trial: only 1 analysis to taste the value
    goalsPerDay: 1,
    teamMembers: 0,
    historyRetention: 1 // Only today
  },
  pro: {
    tabAnalysesPerDay: -1, // Unlimited
    goalsPerDay: -1, // Unlimited  
    teamMembers: 0,
    historyRetention: 7 // 1 week
  },
  team: {
    tabAnalysesPerDay: -1, // Unlimited
    goalsPerDay: -1, // Unlimited
    teamMembers: 10,
    historyRetention: 30 // 1 month
  }
};

// Auth state management
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction = 
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; user: User }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'AUTH_LOGOUT' }; 