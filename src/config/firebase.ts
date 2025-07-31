// Firebase Configuration
// Updated with actual project credentials

// TODO: Replace with your actual Firebase config
export const firebaseConfig = {
  apiKey: "your_firebase_api_key_here",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.firebasestorage.app",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
};

// Environment detection for development vs production
export const isDevelopment = !('update_url' in chrome.runtime.getManifest());

// Firebase initialization will be done in firebase.service.ts
export const FIREBASE_COLLECTIONS = {
  users: 'users',
  goals: 'goals', 
  tabAnalyses: 'tabAnalyses',
  subscriptions: 'subscriptions',
  teamGoals: 'teamGoals'
} as const; 