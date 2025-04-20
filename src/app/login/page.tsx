"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Clear popup after 3 seconds
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use email directly
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Display more specific error messages based on Firebase error codes
      switch (error.code) {
        case 'auth/user-not-found':
          setError('Account does not exist. Please register first.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please check your credentials.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format. Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later.');
          break;
        default:
          setError(error.message || 'An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    
    try {
      // Use email directly for Firebase auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Extract username from email for display purposes
      const username = email.split('@')[0];
      
      // Add user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        username: username,
        role: 'viewer', // Default role for new users
        created_at: serverTimestamp(),
        last_login: serverTimestamp()
      });
      
      // Sign out the user after registration
      await auth.signOut();
      
      // Store credentials temporarily
      const registeredEmail = email;
      
      // Reset form fields
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Show popup and success message
      setShowPopup(true);
      setSuccess('Account created successfully! You can now sign in.');
      
      // Switch back to login form
      setIsRegistering(false);
      
      // After a brief delay to ensure state updates, set the email field
      setTimeout(() => {
        setEmail(registeredEmail);
        setLoading(false);
      }, 100);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email.');
      } else {
        setError(error.message || 'Failed to create account.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Warehouse Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {isRegistering 
              ? 'Create a new account' 
              : 'Sign in to access your dashboard'}
          </p>
        </div>
        
        {/* Registration Success Popup */}
        {showPopup && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-50">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Credentials successfully created.</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}
        
        {isRegistering ? (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Create a password"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
              } transition-colors`}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setError('');
              setSuccess('');
              setIsRegistering(!isRegistering);
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            {isRegistering 
              ? 'Already have an account? Sign in' 
              : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
} 