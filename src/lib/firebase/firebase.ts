import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
console.log('Firebase initialized with app:', app.name);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase services initialized:', {
  auth: !!auth,
  db: !!db,
  storage: !!storage
});

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  // Analytics can only be used in browser environments
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error('Firebase Analytics failed to initialize:', error);
  }
}

export { app, auth, db, storage, analytics };
