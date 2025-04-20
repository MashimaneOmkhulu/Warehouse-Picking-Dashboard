'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBZU32kSXWlYVwgOBKqT5XTBBcEjYO-YOo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "warehouse-dashboard-demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "warehouse-dashboard-demo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "warehouse-dashboard-demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "936467952533",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:936467952533:web:fba51c7bb0843d9afc35e5"
};

console.log('Firebase configuration:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set',
  authDomain: firebaseConfig.authDomain ? 'Set' : 'Not set', 
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? 'Set' : 'Not set'
});

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | null = null;

// Only initialize Firebase in the browser environment
if (typeof window !== 'undefined') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('Firebase services initialized in client');
  
  // Initialize Analytics (only in browser environment)
  try {
    // Dynamic import for analytics to avoid server-side issues
    import('firebase/analytics').then(({ getAnalytics }) => {
      if (app) {
        analytics = getAnalytics(app);
      }
    });
  } catch (error) {
    console.error('Firebase Analytics failed to initialize:', error);
  }
}

export { app, auth, db, storage, analytics };
