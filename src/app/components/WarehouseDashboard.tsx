'use client';

import { useState, useEffect } from 'react';
import { DashboardState, TabType, Picker } from '@/lib/types/warehouse';
import { calculatePerformanceMetrics, calculateShiftProgress } from '@/lib/utils/warehouseUtils';
import HorizontalPickerList from './HorizontalPickerList';
import RaceTrack from './RaceTrack';
import EnhancedPerformanceDisplay from './EnhancedPerformanceDisplay';
import ShiftPerformanceCards from './ShiftPerformanceCards';
import EndOfShiftProjection from './EndOfShiftProjection';
import ManagementAnalyticsView from './ManagementAnalyticsView';
import DashboardStateSaver from './DashboardStateSaver';
import StickyHeader from './ui/StickyHeader';
import { useToast } from './ui/Toast';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock data for initial state
const initialPickers = [
  {
    id: '1',
    name: 'John Smith',
    performance: 0,
    target: 100,
    status: 'active' as const,
    hourlyData: Array.from({ length: 9 }, (_, i) => ({
      hour: i + 9,
      lines: 0,
      target: 100,
      efficiency: 0
    })),
    startTime: '09:00',
    endTime: '17:00',
    breaks: []
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    performance: 0,
    target: 120,
    status: 'active' as const,
    hourlyData: Array.from({ length: 9 }, (_, i) => ({
      hour: i + 9,
      lines: 0,
      target: 120,
      efficiency: 0
    })),
    startTime: '09:00',
    endTime: '17:00',
    breaks: []
  },
  {
    id: '3',
    name: 'Mike Wilson',
    performance: 0,
    target: 110,
    status: 'active' as const,
    hourlyData: Array.from({ length: 9 }, (_, i) => ({
      hour: i + 9,
      lines: 0,
      target: 110,
      efficiency: 0
    })),
    startTime: '09:00',
    endTime: '17:00',
    breaks: []
  }
];

const WarehouseDashboard = () => {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    pickers: initialPickers,
    showRaceTrack: false,
    lastSyncTime: new Date().toISOString(),
    currentTab: 'hourly' as TabType,
    performanceMetrics: {
      totalLines: 0,
      averageLinesPerPicker: 0,
      efficiencyScore: 0,
      averageLinesPerHour: 0,
      bestPerformer: {
        pickerId: '',
        name: '',
        lines: 0,
        efficiency: 0
      },
      worstPerformer: {
        pickerId: '',
        name: '',
        lines: 0,
        efficiency: 0
      },
      hourlyAnalysis: []
    },
    shiftProgress: calculateShiftProgress(),
    hourlyData: Array.from({ length: 9 }, (_, i) => ({
      hour: i + 9,
      lines: 0,
      target: 100,
      efficiency: 0
    })),
    hourlyPerformance: {},
    targetLinesPerHour: 100
  });

  const [showManagement, setShowManagement] = useState(false);
  const [showManagementView, setShowManagementView] = useState(false);
  const [showTeamPerformance, setShowTeamPerformance] = useState(false);
  const [showEndOfShift, setShowEndOfShift] = useState(false);
  const [editingPicker, setEditingPicker] = useState<Picker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const { addToast } = useToast();

  // Add state for the header visibility
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  // Toggle the header visibility
  const toggleHeaderVisibility = () => {
    setIsHeaderExpanded(prev => !prev);
  };

  // Initialize Firestore data and set up real-time listeners
  useEffect(() => {
    const initializeFirestore = async () => {
      try {
        setIsLoading(true);
        
        if (!db) {
          console.error('Firestore db is undefined');
          setSyncStatus('error');
          setIsLoading(false);
          return () => {};
        }
        
        // Check if shared state document exists
        const sharedStateRef = doc(db, 'sharedStates', 'current');
        const sharedStateDoc = await getDoc(sharedStateRef);
        
        if (!sharedStateDoc.exists()) {
          // First-time setup: Initialize the shared state with default data
          console.log('Initializing shared state with default data');
          await setDoc(sharedStateRef, {
            pickers: initialPickers,
            lastSyncTime: serverTimestamp(),
            targetLinesPerHour: 100,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        // Set up real-time listener for the shared state data
        const unsubscribe = onSnapshot(
          sharedStateRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              
              // Update state with data from Firestore
              setState(prev => {
                // Calculate metrics based on the new picker data
                const updatedPickers = data.pickers || initialPickers;
                const metrics = calculatePerformanceMetrics(updatedPickers);
                
                // Update hourly data based on actual picker data
                const updatedHourlyData = Array.from({ length: 9 }, (_, i) => {
                  const hour = i + 9;
                  const totalLinesForHour = updatedPickers.reduce((sum, picker) => {
                    const pickerHourData = picker.hourlyData.find(h => h.hour === hour);
                    return sum + (pickerHourData?.lines || 0);
                  }, 0);
                  
                  return {
                    hour,
                    lines: totalLinesForHour,
                    target: data.targetLinesPerHour || 100,
                    efficiency: totalLinesForHour / ((data.targetLinesPerHour || 100) * updatedPickers.length)
                  };
                });
                
                return {
                  ...prev,
                  pickers: updatedPickers,
                  lastSyncTime: data.lastSyncTime?.toDate().toISOString() || new Date().toISOString(),
                  targetLinesPerHour: data.targetLinesPerHour || 100,
                  performanceMetrics: metrics,
                  hourlyData: updatedHourlyData
                };
              });
              
              setSyncStatus('synced');
            }
          },
          (error) => {
            console.error('Error listening to shared state changes:', error);
            setSyncStatus('error');
          }
        );
        
        setIsLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing Firestore:', error);
        setSyncStatus('error');
        setIsLoading(false);
        return () => {};
      }
    };
    
    initializeFirestore();
  }, []);

  // Update shift progress every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        shiftProgress: calculateShiftProgress()
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Function to update Firestore when state changes (for pickers only)
  const updateFirestore = async (updatedPickers: Picker[]) => {
    try {
      setSyncStatus('syncing');
      
      if (!db) {
        console.error('Firestore db is undefined');
        setSyncStatus('error');
        addToast('Firebase not initialized', 'error');
        return;
      }
      
      // Use a consistent document ID for the shared state
      const sharedStateId = 'current'; // You could use a more descriptive name if needed
      const sharedStateRef = doc(db, 'sharedStates', sharedStateId);
      
      await updateDoc(sharedStateRef, {
        pickers: updatedPickers,
        lastSyncTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error updating Firestore:', error);
      setSyncStatus('error');
      addToast('Error updating database', 'error');
    }
  };

  // Add a manual sync function instead of automatic syncing
  const manualSyncToFirestore = (pickers = state.pickers) => {
    try {
      updateFirestore(pickers);
    } catch (error) {
      console.error('Error in manual sync:', error);
      addToast('Failed to sync with database', 'error');
    }
  };

  const toggleRaceTrack = () => {
    setState(prev => ({
      ...prev,
      showRaceTrack: !prev.showRaceTrack
    }));
  };

  const toggleManagementView = () => {
    setShowManagementView(prev => !prev);
    // Hide other views when showing analytics
    if (!showManagementView) {
      setShowTeamPerformance(false);
    }
  };

  const toggleManagement = () => {
    setShowManagement(prev => !prev);
  };

  const toggleTeamPerformance = () => {
    setShowTeamPerformance(prev => !prev);
    // Hide race track when showing team performance
    if (!showTeamPerformance && state.showRaceTrack) {
      setState(prev => ({
        ...prev,
        showRaceTrack: false
      }));
    }
  };

  const toggleEndOfShift = () => {
    setShowEndOfShift(prev => !prev);
  };

  // Client-side only time display component
  const TimeDisplay = () => {
    const [formattedTime, setFormattedTime] = useState<string>('');

    useEffect(() => {
      setFormattedTime(new Date(state.lastSyncTime).toLocaleTimeString());
    }, [state.lastSyncTime]);

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{formattedTime}</span>
        {syncStatus === 'syncing' && (
          <div className="flex items-center">
            <svg className="animate-spin h-4 w-4 mr-1 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs text-yellow-600">Syncing...</span>
          </div>
        )}
        {syncStatus === 'synced' && (
          <span className="text-xs text-green-600 flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block mr-1 animate-pulse"></span> 
            Live
          </span>
        )}
        {syncStatus === 'error' && (
          <span className="text-xs text-red-600 animate-warning-pulse">Sync Error</span>
        )}
      </div>
    );
  };

  // Update the handleDeletePicker function
  const handleDeletePicker = (id: string) => {
    const pickerToDelete = state.pickers.find(picker => picker.id === id);
    const updatedPickers = state.pickers.filter(picker => picker.id !== id);
    
    // Update local state immediately
    setState(prev => ({
      ...prev,
      pickers: updatedPickers
    }));
    
    // After local state update, try to sync to Firestore
    try {
      manualSyncToFirestore(updatedPickers);
      addToast(`Deleted picker: ${pickerToDelete?.name || 'Unknown'}`, 'info');
    } catch (error) {
      console.log('Firestore sync failed after deletion, but UI is updated', error);
      addToast('Failed to sync deletion to database', 'error');
    }
  };

  // Update the handleSavePicker function
  const handleSavePicker = () => {
    if (!editingPicker) return;
    
    const updatedPickers = state.pickers.map(picker => 
      picker.id === editingPicker.id ? editingPicker : picker
    );
    
    // Update local state first
    setState(prev => ({
      ...prev,
      pickers: updatedPickers
    }));
    
    // After local state update, try to sync to Firestore
    try {
      manualSyncToFirestore(updatedPickers);
      addToast(`Updated picker: ${editingPicker.name}`, 'success');
    } catch (error) {
      console.log('Firestore sync failed after edit, but UI is updated', error);
      addToast('Failed to sync changes to database', 'error');
    }
    
    // Close the edit form
    setEditingPicker(null);
  };

  // Add a form for editing picker when editingPicker is set
  const renderEditForm = () => {
    if (!editingPicker) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Picker</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Picker Name
              </label>
              <input
                type="text"
                value={editingPicker.name}
                onChange={(e) => setEditingPicker({...editingPicker, name: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Lines
              </label>
              <input
                type="number"
                value={editingPicker.target}
                onChange={(e) => setEditingPicker({
                  ...editingPicker, 
                  target: parseInt(e.target.value) || 0
                })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="flex space-x-2">
                {['active', 'break', 'offline'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setEditingPicker({
                      ...editingPicker, 
                      status: status as 'active' | 'break' | 'offline'
                    })}
                    className={`px-3 py-1 text-sm rounded-full ${
                      editingPicker.status === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setEditingPicker(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePicker}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handles loading a saved state from Firebase
  const handleLoadState = (loadedState: DashboardState) => {
    console.log('Loading state into dashboard:', { 
      hasPickers: Boolean(loadedState.pickers), 
      pickerCount: loadedState.pickers?.length
    });
    
    try {
      // Verify the loaded state has the required properties before setting state
      if (!loadedState || typeof loadedState !== 'object') {
        console.error('Invalid state object received:', loadedState);
        addToast('Failed to load state: Invalid data', 'error');
        return;
      }
      
      // Create a sanitized copy to prevent any issues
      const sanitizedState = {
        ...loadedState,
        // Ensure pickers is an array
        pickers: Array.isArray(loadedState.pickers) ? loadedState.pickers : [],
        // Set lastSyncTime to current time
        lastSyncTime: new Date().toISOString()
      };
      
      // Just update the local state without triggering Firebase updates
      setState(sanitizedState);
      console.log('State loaded successfully without Firebase update');
      addToast('Dashboard state loaded successfully', 'success');
      
      // No automatic Firebase update to prevent refresh loops
      
    } catch (error) {
      console.error('Error applying loaded state:', error);
      addToast('Failed to load dashboard state', 'error');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-xl text-gray-700">Loading warehouse dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header with controls - Now sticky and with toggle button */}
            <StickyHeader>
              <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-500 text-white p-3 rounded-lg hover-scale transition-all-smooth">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800 leading-tight">Warehouse Dashboard</h1>
                      <p className="text-sm text-gray-500">
                        Last synced: {new Date(state.lastSyncTime).toLocaleTimeString()}
                        {syncStatus === 'syncing' && <span className="ml-2 text-indigo-500">Syncing...</span>}
                        {syncStatus === 'error' && <span className="ml-2 text-red-500 animate-warning-pulse">Sync error</span>}
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle button for header visibility */}
                  <button 
                    onClick={toggleHeaderVisibility}
                    className="btn-ripple p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all-smooth"
                    aria-label={isHeaderExpanded ? "Collapse header" : "Expand header"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isHeaderExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Collapsible content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHeaderExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-wrap gap-3 justify-center my-4">
                    <button
                      onClick={toggleRaceTrack}
                      className="btn-ripple px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all-smooth shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>{state.showRaceTrack ? 'Hide Race Track' : 'Show Race Track'}</span>
                    </button>
                    <button
                      onClick={toggleTeamPerformance}
                      className="btn-ripple px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all-smooth shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{showTeamPerformance ? 'Hide Team Performance' : 'Show Team Performance'}</span>
                    </button>
                    <button
                      onClick={toggleManagement}
                      className="btn-ripple px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all-smooth shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{showManagement ? 'Hide Management' : 'Show Management'}</span>
                    </button>
                    <button
                      onClick={toggleManagementView}
                      className="btn-ripple px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all-smooth shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>{showManagementView ? 'Hide Analytics' : 'Show Analytics'}</span>
                    </button>
                    <button
                      onClick={toggleEndOfShift}
                      className="btn-ripple px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all-smooth shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{showEndOfShift ? 'Hide End of Shift' : 'Show End of Shift'}</span>
                    </button>
                  </div>
                  
                  {/* Time Display */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{new Date(state.lastSyncTime).toLocaleTimeString()}</span>
                    <span className="text-xs text-green-600 flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block mr-1 animate-pulse"></span> 
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </StickyHeader>
            
            {/* Dashboard State Saver Component */}
            {user && (
              <DashboardStateSaver 
                currentState={state} 
                loadState={handleLoadState}
              />
            )}
            
            {/* Render edit form */}
            {renderEditForm()}
            
            {/* Team Performance Cards */}
            {showTeamPerformance && (
              <div className="mb-6 animate-slideUp">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Team Performance</h2>
                <ShiftPerformanceCards 
                  pickers={state.pickers} 
                />
              </div>
            )}
            
            {/* Management Analytics View */}
            {showManagementView && (
              <div className="animate-slideUp">
                <ManagementAnalyticsView 
                  state={state} 
                  performanceMetrics={state.performanceMetrics}
                  onBackToMain={toggleManagementView}
                  setState={setState}
                />
              </div>
            )}
            
            {/* Management Section with Horizontal Picker List */}
            {showManagement && (
              <div className="animate-slideUp mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Picker Management</h2>
                <HorizontalPickerList 
                  state={state} 
                  onEdit={(picker) => setEditingPicker(picker)} 
                  onDelete={(id) => handleDeletePicker(id)}
                  setState={setState}
                />
              </div>
            )}
            
            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
              {/* Performance Display and Race Track */}
              <div className="space-y-6">
                {/* Show End of Shift projection only when its button is pressed */}
                {showEndOfShift && (
                  <div className="animate-slideUp">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">End of Shift Projections</h2>
                    <EndOfShiftProjection pickers={state.pickers} />
                  </div>
                )}
                
                {/* Show Race Track when enabled */}
                {state.showRaceTrack && (
                  <div className="animate-slideUp">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Picker Race Track</h2>
                    <RaceTrack 
                      pickers={state.pickers} 
                      shiftDuration={8} // assuming 8-hour shift (9am-5pm)
                      shiftElapsed={(() => {
                        const now = new Date();
                        const start = new Date();
                        start.setHours(9, 0, 0, 0); // 9am start
                        return Math.min(8, Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60)));
                      })()}
                      target={state.pickers.length > 0 ? state.pickers[0].target : 1000} // Use first picker's target or default
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WarehouseDashboard; 