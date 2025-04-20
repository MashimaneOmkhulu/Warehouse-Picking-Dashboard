'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { saveDashboardState, loadDashboardState, getDashboardStateNames, deleteDashboardState } from '@/lib/firebase/firebaseUtils';
import { DashboardState } from '@/lib/types/warehouse';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface DashboardStateSaverProps {
  currentState: DashboardState;
  loadState: (newState: DashboardState) => void;
}

const DashboardStateSaver: React.FC<DashboardStateSaverProps> = ({ currentState, loadState }) => {
  const { user } = useAuth();
  const [stateName, setStateName] = useState('');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [firestoreStatus, setFirestoreStatus] = useState('Unknown');
  const [isVisible, setIsVisible] = useState(true);

  // Message display function
  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }, []);

  const fetchAvailableStates = useCallback(async () => {
    if (!user) return;
    
    console.log('Fetching available states for user:', user.uid);
    try {
      // Add debug info for troubleshooting
      console.log('User details:', { 
        uid: user.uid, 
        email: user.email,
        isAnonymous: user.isAnonymous
      });
      
      const stateNames = await getDashboardStateNames(user.uid);
      console.log('Available states retrieved:', stateNames);
      setAvailableStates(stateNames);
      
      // If no state is currently selected and we have states available, select the first one
      if (stateNames.length > 0 && !selectedState) {
        console.log('Auto-selecting first available state:', stateNames[0]);
        setSelectedState(stateNames[0]);
      }
    } catch (error) {
      console.error('Error fetching state names:', error);
      showMessage('Failed to load saved states', 'error');
    }
  }, [user, selectedState, showMessage]);

  // Test Firestore connection
  const testFirestoreConnection = useCallback(async () => {
    try {
      console.log('Testing Firestore connection...');
      if (!db) {
        console.error('Firestore db is undefined');
        setFirestoreStatus('Not Initialized');
        showMessage('Firebase not initialized', 'error');
        return;
      }
      const testQuery = query(collection(db, 'dashboardStates'), limit(1));
      const snapshot = await getDocs(testQuery);
      console.log('Firestore connection test result:', { 
        success: true,
        docsReturned: snapshot.size,
        empty: snapshot.empty
      });
      setFirestoreStatus('Connected');
    } catch (error) {
      console.error('Firestore connection test failed:', error);
      setFirestoreStatus('Connection Failed');
      showMessage('Firebase connection error', 'error');
    }
  }, [showMessage]);

  // Load available states when component mounts
  useEffect(() => {
    if (user) {
      fetchAvailableStates();
      testFirestoreConnection();
    }
  }, [user, fetchAvailableStates, testFirestoreConnection]);

  // Add a function to manually check for saved states directly in Firestore
  const checkFirestoreStates = async () => {
    if (!user) {
      showMessage('Must be logged in to check states', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Directly checking Firestore for saved states...');
      
      if (!db) {
        console.error('Firestore db is undefined');
        setFirestoreStatus('Not Initialized');
        showMessage('Firebase not initialized', 'error');
        return;
      }
      
      // Get a reference to the dashboardStates collection
      const statesRef = collection(db, 'dashboardStates');
      
      // Create a query to find all states for this user
      const q = query(statesRef, where('userId', '==', user.uid));
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} saved states in Firestore`);
      
      // Log details about each state
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('State document:', {
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
          hasStateData: !!data.state
        });
      });
      
      if (querySnapshot.size > 0) {
        // Refresh the state names
        fetchAvailableStates();
        showMessage(`Found ${querySnapshot.size} states in Firestore`, 'success');
      } else {
        showMessage('No states found in Firestore', 'error');
      }
    } catch (error) {
      console.error('Error checking Firestore:', error);
      showMessage('Error checking Firestore', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to handle dropdown selection change
  const handleStateSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelection = e.target.value;
    console.log('State selected from dropdown:', newSelection);
    setSelectedState(newSelection);
  };

  const handleSave = async () => {
    if (!user) {
      showMessage('You must be logged in to save', 'error');
      console.error('Save attempted without user logged in');
      return;
    }
    
    if (!stateName.trim()) {
      showMessage('Please enter a name for this state', 'error');
      return;
    }
    
    console.log('Attempting to save dashboard state:', { 
      userId: user.uid, 
      stateName,
      stateSize: JSON.stringify(currentState).length
    });
    
    setIsLoading(true);
    try {
      // Test if the state can be properly serialized
      const stateJSON = JSON.stringify(currentState);
      console.log('State successfully serialized, size:', stateJSON.length);
      
      // Create a deep copy of the state to sanitize
      const stateCopy = JSON.parse(stateJSON);
      
      // Fix the shiftProgress.nextBreak issue - Firebase doesn't allow undefined values
      if (stateCopy.shiftProgress && stateCopy.shiftProgress.nextBreak) {
        // If nextBreak exists but has undefined fields, either fix them or remove nextBreak entirely
        if (typeof stateCopy.shiftProgress.nextBreak.type === 'undefined' || 
            typeof stateCopy.shiftProgress.nextBreak.startsIn === 'undefined') {
          // Remove nextBreak entirely if it has undefined fields
          delete stateCopy.shiftProgress.nextBreak;
        }
      }
      
      // Recursively sanitize any other undefined values
      const sanitizeUndefined = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          if (obj[key] === undefined) {
            // Replace undefined with null (which Firestore accepts)
            obj[key] = null;
          } else if (typeof obj[key] === 'object') {
            sanitizeUndefined(obj[key]);
          }
        });
      };
      
      sanitizeUndefined(stateCopy);
      console.log('State sanitized for Firestore');
      
      const stateId = await saveDashboardState(user.uid, stateName, stateCopy);
      console.log('Dashboard state saved successfully with ID:', stateId);
      showMessage(`Dashboard saved as "${stateName}"`, 'success');
      fetchAvailableStates();
      setStateName('');
    } catch (error) {
      console.error('Error saving state:', error);
      // Enhanced error reporting
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        showMessage(`Failed to save: ${error.message}`, 'error');
      } else {
        showMessage('Failed to save dashboard state', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!user) {
      showMessage('You must be logged in to load', 'error');
      return;
    }
    
    if (!selectedState) {
      showMessage('Please select a state to load', 'error');
      return;
    }
    
    console.log('Starting to load state:', selectedState);
    setIsLoading(true);
    try {
      // First verify the state exists
      console.log(`Loading state "${selectedState}" for user ${user.uid}`);
      const states = await loadDashboardState(user.uid, selectedState);
      console.log('Load result:', { 
        found: states.length > 0, 
        stateData: states[0]?.id,
        stateStructure: states[0] ? {
          hasPickers: !!states[0].state.pickers,
          pickerCount: states[0].state.pickers?.length || 0
        } : null
      });
      
      if (states.length > 0) {
        console.log('State loaded successfully, applying to dashboard');
        
        // Deep copy the state to avoid reference issues
        const stateToLoad = JSON.parse(JSON.stringify(states[0].state));
        
        // Apply the loaded state to the dashboard
        loadState(stateToLoad);
        showMessage(`Loaded "${selectedState}" successfully`, 'success');
      } else {
        console.error('No state found with name:', selectedState);
        showMessage('No state found with that name', 'error');
        
        // Refresh the list in case the state was deleted
        fetchAvailableStates();
      }
    } catch (error) {
      console.error('Error loading state:', error);
      if (error instanceof Error) {
        showMessage(`Failed to load: ${error.message}`, 'error');
      } else {
        showMessage('Failed to load dashboard state', 'error');
      }
      
      // Try to refresh the available states
      fetchAvailableStates();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      showMessage('You must be logged in to delete', 'error');
      return;
    }
    
    if (!selectedState) {
      showMessage('Please select a state to delete', 'error');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${selectedState}"?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const states = await loadDashboardState(user.uid, selectedState);
      if (states.length > 0) {
        await deleteDashboardState(states[0].id);
        showMessage(`Deleted "${selectedState}" successfully`, 'success');
        fetchAvailableStates();
        setSelectedState('');
      } else {
        showMessage('No state found with that name', 'error');
      }
    } catch (error) {
      console.error('Error deleting state:', error);
      showMessage('Failed to delete dashboard state', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new handler for emergency minimal save
  const handleEmergencySave = async () => {
    if (!user || !stateName.trim()) {
      showMessage('Need login and state name', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      // Create minimal state object without any undefined values
      const minimalState = {
        pickers: [{ 
          id: 'test', 
          name: 'Test Picker',
          target: 100,
          performance: 0,
          hourlyData: [],
          status: 'active' as const,
          startTime: '09:00',
          endTime: '17:00',
          breaks: []
        }],
        showRaceTrack: false,
        lastSyncTime: new Date().toISOString(),
        currentTab: 'team' as const,
        performanceMetrics: {
          totalLines: 0,
          averageLinesPerPicker: 0,
          efficiencyScore: 0,
          averageLinesPerHour: 0,
          bestPerformer: { pickerId: '', name: '', lines: 0, efficiency: 0 },
          worstPerformer: { pickerId: '', name: '', lines: 0, efficiency: 0 },
          hourlyAnalysis: []
        },
        shiftProgress: {
          percentageComplete: 0,
          remainingTime: 0,
          isBreakTime: false,
          // nextBreak is completely omitted rather than having undefined fields
        },
        hourlyData: [],
        hourlyPerformance: {},
        targetLinesPerHour: 50
      };
      
      console.log('Saving minimal state');
      const stateId = await saveDashboardState(user.uid, stateName, minimalState);
      console.log('Minimal state saved successfully with ID:', stateId);
      showMessage(`Emergency save successful`, 'success');
      fetchAvailableStates();
    } catch (error) {
      console.error('Emergency save failed:', error);
      if (error instanceof Error) {
        showMessage(`Emergency save failed: ${error.message}`, 'error');
      } else {
        showMessage('Emergency save failed', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // The toggle visibility function
  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  if (!user) {
    return null; // Don't show the component if user is not logged in
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-800">Dashboard State</h2>
        <button 
          onClick={toggleVisibility}
          className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {/* Status indicators - always visible */}
      <div className="mb-3 text-sm">
        <span className="mr-2">Firebase status:</span>
        <span className={`font-medium ${
          firestoreStatus === 'Connected' ? 'text-green-600' : 
          firestoreStatus === 'Connection Failed' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {firestoreStatus}
        </span>
      </div>
      
      {/* Message display */}
      {message.text && (
        <div className={`mb-4 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      {/* Content that can be hidden */}
      {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Save section */}
          <div className="border rounded p-3">
            <h3 className="text-md font-medium mb-2">Save Current State</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Enter state name"
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleSave}
                disabled={isLoading || !stateName.trim()}
                className={`px-4 py-2 rounded font-medium ${
                  isLoading || !stateName.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={handleEmergencySave}
                disabled={isLoading || !stateName.trim()}
                className={`w-full px-2 py-1 text-sm rounded font-medium ${
                  isLoading || !stateName.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                Emergency Minimal Save
              </button>
            </div>
          </div>
          
          {/* Load section */}
          <div className="border rounded p-3">
            <h3 className="text-md font-medium mb-2">Load Saved State</h3>
            <div className="flex space-x-2">
              <select
                value={selectedState}
                onChange={handleStateSelection}
                className="flex-1 p-2 border rounded"
              >
                <option value="">Select a saved state</option>
                {availableStates.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLoad}
                disabled={isLoading || !selectedState}
                className={`px-3 py-2 rounded font-medium ${
                  isLoading || !selectedState
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isLoading ? 'Loading...' : 'Load'}
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || !selectedState}
                className={`px-3 py-2 rounded font-medium ${
                  isLoading || !selectedState
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                Delete
              </button>
            </div>
            {availableStates.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">No saved states available</p>
            )}
            <div className="mt-2">
              <button
                onClick={checkFirestoreStates}
                disabled={isLoading}
                className={`w-full px-2 py-1 text-sm rounded font-medium ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Refresh State List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStateSaver; 