import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';

// POST /api/auth/login - Authenticate user credentials
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    
    try {
      // Format username as email for Firebase authentication
      const email = `${username}@warehouse.app`;
      
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const userData = userDoc.data();
      
      // Update last login timestamp
      await updateDoc(doc(db, 'users', user.uid), {
        last_login: serverTimestamp()
      });
      
      // Create JWT token
      const token = sign(
        { 
          uid: user.uid,
          username: userData.username,
          role: userData.role
        },
        process.env.JWT_SECRET || 'warehouse-dashboard-secret',
        { expiresIn: '24h' }
      );
      
      // Set token in a cookie
      // In a production app, make this secure, httpOnly, sameSite, etc.
      const cookieStore = cookies();
      cookieStore.set('auth_token', token, {
        maxAge: 24 * 60 * 60,
        path: '/',
      });
      
      // Return success with user data
      return NextResponse.json({
        success: true,
        user: {
          id: user.uid,
          username: userData.username,
          role: userData.role
        },
        token
      });
      
    } catch (error: any) {
      console.error('Firebase authentication error:', error);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 