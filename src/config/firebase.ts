// Firebase Configuration
// Updated with actual project credentials

export const firebaseConfig = {
  apiKey: "AIzaSyAElxUotdZ5RiO-GWs0wjBZpc6vhbt9AuY",
  authDomain: "tabbit-f3fd7.firebaseapp.com",
  projectId: "tabbit-f3fd7",
  storageBucket: "tabbit-f3fd7.firebasestorage.app",
  messagingSenderId: "45262224715",
  appId: "1:45262224715:web:9989605cd1b5cb0f393cce",
  measurementId: "G-SFE0MGVLW3"
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