// Firebase Authentication Service for TabMind

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseConfig, FIREBASE_COLLECTIONS } from '../config/firebase';
import { User, SubscriptionPlan, UserPreferences, UsageStats } from '../types/user';

export class AuthService {
  private app;
  private auth;
  private db;
  private googleProvider;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.googleProvider = new GoogleAuthProvider();
    
    // Configure Google provider
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  /**
   * Sign in with Google using Chrome Identity API
   */
  async signInWithGoogle(): Promise<User> {
    try {
      // Use Chrome Identity API for extension
      if (typeof chrome !== 'undefined' && chrome.identity) {
        const token = await new Promise<string>((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (token) {
              resolve(token);
            } else {
              reject(new Error('No token received'));
            }
          });
        });
        
        // Use token to sign in to Firebase
        const credential = GoogleAuthProvider.credential(null, token);
        const result = await signInWithCredential(this.auth, credential);
        const firebaseUser = result.user;
        
        // Create or update user document in Firestore
        const user = await this.createOrUpdateUser(firebaseUser);
        
        console.log('Successfully signed in with Google via Chrome Identity:', user.email);
        return user;
      } else {
        // Fallback to popup for web (shouldn't happen in extension)
        const result = await signInWithPopup(this.auth, this.googleProvider);
        const firebaseUser = result.user;
        
        // Create or update user document in Firestore
        const user = await this.createOrUpdateUser(firebaseUser);
        
        console.log('Successfully signed in with Google:', user.email);
        return user;
      }
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  /**
   * Sign in anonymously for trial users
   */
  async signInAnonymously(): Promise<User> {
    try {
      const result = await signInAnonymously(this.auth);
      const firebaseUser = result.user;
      
      // Create anonymous user document
      const user = await this.createOrUpdateUser(firebaseUser, true);
      
      console.log('Successfully signed in anonymously');
      return user;
      
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      throw new Error(error.message || 'Failed to sign in anonymously');
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Successfully signed out');
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  /**
   * Get current user data from Firestore
   */
  async getCurrentUserData(): Promise<User | null> {
    const firebaseUser = this.getCurrentUser();
    if (!firebaseUser) return null;

    try {
      const userDoc = await getDoc(doc(this.db, FIREBASE_COLLECTIONS.users, firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          lastActive: data.lastActive.toDate(),
          usage: {
            ...data.usage,
            lastResetDate: data.usage.lastResetDate.toDate()
          }
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await this.getCurrentUserData();
        callback(userData);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Create or update user document in Firestore
   */
  private async createOrUpdateUser(firebaseUser: FirebaseUser, isAnonymous = false): Promise<User> {
    const userRef = doc(this.db, FIREBASE_COLLECTIONS.users, firebaseUser.uid);
    
    try {
      const existingUser = await getDoc(userRef);
      const now = new Date();
      
      if (existingUser.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          lastActive: now,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Anonymous User',
          photoURL: firebaseUser.photoURL || undefined
        });
        
        const userData = existingUser.data();
        return {
          ...userData,
          createdAt: userData.createdAt.toDate(),
          lastActive: now,
          usage: {
            ...userData.usage,
            lastResetDate: userData.usage.lastResetDate.toDate()
          }
        } as User;
        
      } else {
        // Create new user
        const defaultPreferences: UserPreferences = {
          theme: 'system',
          notifications: {
            goalReminders: true,
            automationAlerts: true,
            progressChecks: true
          },
          automation: {
            autoCloseDiscard: false, // Start conservative
            autoPinReference: true,
            autoGroupLater: true
          },
          privacy: {
            shareAnalytics: true,
            allowTeamSharing: false
          }
        };

        const defaultUsage: UsageStats = {
          tabAnalyses: 0,
          dailyGoals: 0,
          automationActions: 0,
          lastResetDate: now
        };

        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || (isAnonymous ? 'Anonymous User' : 'TabMind User'),
          photoURL: firebaseUser.photoURL || undefined,
          subscription: 'free',
          createdAt: now,
          lastActive: now,
          preferences: defaultPreferences,
          usage: defaultUsage
        };

        await setDoc(userRef, {
          ...newUser,
          createdAt: now,
          lastActive: now,
          usage: {
            ...newUser.usage,
            lastResetDate: now
          }
        });

        console.log('Created new user document:', newUser.uid);
        return newUser;
      }
      
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to create or update user data');
    }
  }

  /**
   * Update user subscription
   */
  async updateUserSubscription(userId: string, subscription: SubscriptionPlan): Promise<void> {
    try {
      const userRef = doc(this.db, FIREBASE_COLLECTIONS.users, userId);
      await updateDoc(userRef, {
        subscription,
        lastActive: new Date()
      });
      console.log(`Updated user ${userId} subscription to ${subscription}`);
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const userRef = doc(this.db, FIREBASE_COLLECTIONS.users, userId);
      await updateDoc(userRef, {
        preferences,
        lastActive: new Date()
      });
      console.log('Updated user preferences');
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Increment usage statistics
   */
  async incrementUsage(userId: string, type: keyof UsageStats): Promise<void> {
    try {
      const userRef = doc(this.db, FIREBASE_COLLECTIONS.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentUsage = userData.usage;
        
        await updateDoc(userRef, {
          [`usage.${type}`]: currentUsage[type] + 1,
          lastActive: new Date()
        });
      }
    } catch (error) {
      console.error(`Error incrementing ${type} usage:`, error);
      // Don't throw error for usage tracking failures
    }
  }

  /**
   * Reset daily usage (called by background script)
   */
  async resetDailyUsage(userId: string): Promise<void> {
    try {
      const userRef = doc(this.db, FIREBASE_COLLECTIONS.users, userId);
      await updateDoc(userRef, {
        'usage.tabAnalyses': 0,
        'usage.dailyGoals': 0,
        'usage.lastResetDate': new Date()
      });
      console.log('Reset daily usage for user:', userId);
    } catch (error) {
      console.error('Error resetting daily usage:', error);
    }
  }
} 