"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

// Types
interface RealtimeContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (type: string, data: any) => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {}
});

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    // Only establish connection if user is authenticated
    if (!user) {
      setIsConnected(false);
      return;
    }
    
    // Simulate a connection
    const timer = setTimeout(() => {
      setIsConnected(true);
      console.log('Simulated WebSocket connected');
    }, 1000);
    
    // Clean up on unmount
    return () => {
      clearTimeout(timer);
      setIsConnected(false);
    };
  }, [user]);
  
  // Simulate sending a message
  const sendMessage = (type: string, data: any) => {
    console.log(`Sending message: ${type}`, data);
    
    // Simulate receiving a response
    setTimeout(() => {
      setLastMessage({ type, data, timestamp: new Date().toISOString() });
    }, 500);
  };
  
  return (
    <RealtimeContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </RealtimeContext.Provider>
  );
}; 