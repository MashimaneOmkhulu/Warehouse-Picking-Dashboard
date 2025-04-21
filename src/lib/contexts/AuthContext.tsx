"use client";

import React, { createContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

interface UserData {
  id: string;
  username: string;
  role: "admin" | "viewer";
  created_at: any;
  last_login: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (username: string, password: string) => Promise<any>;
  createUser: (username: string, password: string, role: "admin" | "viewer") => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {
    throw new Error("Not implemented");
  },
  createUser: async () => {},
  signOut: async () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch additional user data from Firestore
  const fetchUserData = async (userId: string) => {
    try {
      if (!db) {
        console.error("Firestore database is not initialized");
        setUserData(null);
        return;
      }
      
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as Omit<UserData, 'id'>;
        setUserData({ ...data, id: userId } as UserData);
        
        // Update last login time
        await updateDoc(userRef, {
          last_login: serverTimestamp()
        });
      } else {
        console.error("No user data found");
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in our database
      if (!db) {
        console.error("Firestore database is not initialized");
        throw new Error("Database not initialized");
      }
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user entry
        await setDoc(userRef, {
          username: user.displayName || user.email?.split('@')[0] || 'user',
          role: "viewer", // Default role for new users
          created_at: serverTimestamp(),
          last_login: serverTimestamp()
        });
      }
      
      await fetchUserData(user.uid);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (username: string, password: string) => {
    try {
      // Firebase requires email, so convert username to email format
      const email = `${username}@warehouse.app`;
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(result.user.uid);
      return result;
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const createUser = async (username: string, password: string, role: "admin" | "viewer") => {
    try {
      // Create email from username for Firebase auth
      const email = `${username}@warehouse.app`;
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add user to Firestore with role and additional info
      if (!db) {
        console.error("Firestore database is not initialized");
        throw new Error("Database not initialized");
      }
      
      await setDoc(doc(db, "users", result.user.uid), {
        username,
        role,
        created_at: serverTimestamp(),
        last_login: serverTimestamp()
      });
      
      await fetchUserData(result.user.uid);
    } catch (error) {
      console.error("Error creating user", error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userData, 
        loading, 
        signInWithGoogle, 
        signInWithEmail,
        createUser,
        signOut: signOutUser,
        isAdmin: userData?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
