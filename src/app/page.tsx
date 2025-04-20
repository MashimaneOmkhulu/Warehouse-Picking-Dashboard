"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRealtime } from '@/lib/contexts/RealtimeContext';
import WarehouseDashboard from '@/app/components/WarehouseDashboard';
import Link from 'next/link';

export default function Home() {
  const { user, userData, loading, isAdmin, signOut } = useAuth();
  const { isConnected } = useRealtime();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Don't render anything during SSR or while loading
  if (!isClient || loading) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // If not authenticated, show nothing (we're redirecting anyway)
  if (!user) {
    return null;
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Dashboard</h1>
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="h-2 w-2 mr-1 rounded-full bg-green-500"></span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <span className="h-2 w-2 mr-1 rounded-full bg-red-500"></span>
                Disconnected
              </span>
            )}
            
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Admin Panel
              </Link>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {userData?.username || user.email?.split('@')[0] || 'User'}
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Signed in as <span className="font-medium">{userData?.username}</span>
      </div>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
        </div>
              )}
        </div>
        </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <WarehouseDashboard />
      </div>
    </main>
  );
}
