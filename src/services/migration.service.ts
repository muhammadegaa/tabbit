// Data Migration Service for TabMind
// Handles migration from chrome.storage.local to Firestore

import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { FIREBASE_COLLECTIONS } from '../config/firebase';
import { User, Goal, TabAnalysis } from '../types/user';

export interface LocalStorageData {
  tabmind_daily_goal?: string;
  tabmind_goal_outcome?: string;
  tabmind_goal_minimum?: string;
  tabmind_analyses?: Record<string, any>;
  tabmind_saved_tabs?: any[];
  tabmind_delegations?: any[];
  tabmind_undo_stack?: any[];
  tabmind_icon_position?: { x: number; y: number };
}

export class MigrationService {
  private db;

  constructor(firebaseApp: any) {
    this.db = getFirestore(firebaseApp);
  }

  /**
   * Migrate user data from chrome.storage.local to Firestore
   */
  async migrateUserData(user: User): Promise<void> {
    try {
      console.log(`Starting migration for user: ${user.uid}`);
      
      // Get all local storage data
      const localData = await this.getLocalStorageData();
      
      if (Object.keys(localData).length === 0) {
        console.log('No local data found to migrate');
        return;
      }

      // Migrate goals
      await this.migrateGoals(user.uid, localData);
      
      // Migrate tab analyses
      await this.migrateTabAnalyses(user.uid, localData);
      
      // Keep user preferences local (icon position, etc.)
      await this.preserveLocalPreferences(localData);
      
      console.log('Migration completed successfully');
      
    } catch (error) {
      console.error('Error during migration:', error);
      throw new Error('Failed to migrate user data');
    }
  }

  /**
   * Get all relevant data from chrome.storage.local
   */
  private async getLocalStorageData(): Promise<LocalStorageData> {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'tabmind_daily_goal',
        'tabmind_goal_outcome', 
        'tabmind_goal_minimum',
        'tabmind_analyses',
        'tabmind_saved_tabs',
        'tabmind_delegations',
        'tabmind_undo_stack',
        'tabmind_icon_position'
      ], (result) => {
        resolve(result as LocalStorageData);
      });
    });
  }

  /**
   * Migrate daily goals to Firestore
   */
  private async migrateGoals(userId: string, localData: LocalStorageData): Promise<void> {
    if (!localData.tabmind_daily_goal) {
      console.log('No goals to migrate');
      return;
    }

    try {
      const goal: Omit<Goal, 'id'> = {
        userId,
        content: localData.tabmind_daily_goal,
        outcome: localData.tabmind_goal_outcome || '',
        minimum: localData.tabmind_goal_minimum || '',
        createdAt: new Date(),
        completed: false,
        archived: false
      };

      // Add goal to Firestore
      await addDoc(collection(this.db, FIREBASE_COLLECTIONS.goals), goal);
      
      console.log('Goals migrated successfully');
      
    } catch (error) {
      console.error('Error migrating goals:', error);
    }
  }

  /**
   * Migrate tab analyses to Firestore
   */
  private async migrateTabAnalyses(userId: string, localData: LocalStorageData): Promise<void> {
    if (!localData.tabmind_analyses || Object.keys(localData.tabmind_analyses).length === 0) {
      console.log('No tab analyses to migrate');
      return;
    }

    try {
      const analyses = localData.tabmind_analyses;
      const migrationPromises: Promise<any>[] = [];

      for (const [tabId, analysis] of Object.entries(analyses)) {
        const tabAnalysis: Omit<TabAnalysis, 'id'> = {
          userId,
          goalId: '', // Will be populated after goal migration
          tabInfo: {
            title: analysis.title || 'Unknown',
            url: analysis.url || '',
            snippet: analysis.snippet || ''
          },
          decision: analysis.decision || analysis.priority || 'do_now',
          confidence: analysis.confidence || 0.8,
          reasoning: analysis.reasoning || analysis.intent || '',
          timestamp: analysis.timestamp ? new Date(analysis.timestamp) : new Date(),
          project: analysis.project || '',
          nextAction: analysis.next_action || analysis.nextAction || ''
        };

        migrationPromises.push(
          addDoc(collection(this.db, FIREBASE_COLLECTIONS.tabAnalyses), tabAnalysis)
        );
      }

      await Promise.all(migrationPromises);
      console.log(`Migrated ${migrationPromises.length} tab analyses`);
      
    } catch (error) {
      console.error('Error migrating tab analyses:', error);
    }
  }

  /**
   * Keep certain preferences in local storage (don't migrate to cloud)
   */
  private async preserveLocalPreferences(localData: LocalStorageData): Promise<void> {
    const preferencesToKeep = {
      tabmind_icon_position: localData.tabmind_icon_position,
      tabmind_undo_stack: localData.tabmind_undo_stack || []
    };

    // Keep these in local storage for quick access
    chrome.storage.local.set(preferencesToKeep);
    console.log('Local preferences preserved');
  }

  /**
   * Clear migrated data from local storage (optional cleanup)
   */
  async clearMigratedData(): Promise<void> {
    const keysToRemove = [
      'tabmind_daily_goal',
      'tabmind_goal_outcome',
      'tabmind_goal_minimum', 
      'tabmind_analyses',
      'tabmind_saved_tabs',
      'tabmind_delegations'
    ];

    return new Promise((resolve) => {
      chrome.storage.local.remove(keysToRemove, () => {
        console.log('Migrated data cleared from local storage');
        resolve();
      });
    });
  }

  /**
   * Create backup of local data before migration
   */
  async createBackup(): Promise<string> {
    try {
      const localData = await this.getLocalStorageData();
      const backup = {
        timestamp: new Date().toISOString(),
        data: localData
      };

      const backupJson = JSON.stringify(backup, null, 2);
      
      // Store backup in local storage with timestamp
      const backupKey = `tabmind_backup_${Date.now()}`;
      chrome.storage.local.set({ [backupKey]: backup });
      
      console.log('Backup created:', backupKey);
      return backupKey;
      
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Restore from backup if migration fails
   */
  async restoreFromBackup(backupKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([backupKey], (result) => {
        const backup = result[backupKey];
        
        if (!backup) {
          reject(new Error('Backup not found'));
          return;
        }

        // Restore the original data
        chrome.storage.local.set(backup.data, () => {
          console.log('Data restored from backup');
          resolve();
        });
      });
    });
  }

  /**
   * Check if user has data to migrate
   */
  async hasDataToMigrate(): Promise<boolean> {
    const localData = await this.getLocalStorageData();
    
    return !!(
      localData.tabmind_daily_goal ||
      (localData.tabmind_analyses && Object.keys(localData.tabmind_analyses).length > 0) ||
      (localData.tabmind_saved_tabs && localData.tabmind_saved_tabs.length > 0)
    );
  }

  /**
   * Get migration status/summary
   */
  async getMigrationSummary(): Promise<{
    goals: number;
    analyses: number;
    savedTabs: number;
    hasData: boolean;
  }> {
    const localData = await this.getLocalStorageData();
    
    return {
      goals: localData.tabmind_daily_goal ? 1 : 0,
      analyses: localData.tabmind_analyses ? Object.keys(localData.tabmind_analyses).length : 0,
      savedTabs: localData.tabmind_saved_tabs ? localData.tabmind_saved_tabs.length : 0,
      hasData: await this.hasDataToMigrate()
    };
  }
} 