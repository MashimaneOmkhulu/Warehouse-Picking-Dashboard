'use client';

import { useState } from 'react';
import { Picker, DashboardState } from '@/lib/types/warehouse';
import { getProgressColor } from '@/lib/utils/warehouseUtils';
import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface HorizontalPickerListProps {
  state: DashboardState;
  onEdit: (picker: Picker) => void;
  onDelete: (id: string) => void;
  setState: React.Dispatch<React.SetStateAction<DashboardState>>;
}

const HorizontalPickerList = ({ state, onEdit, onDelete, setState }: HorizontalPickerListProps) => {
  const [selectedPicker, setSelectedPicker] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [lines, setLines] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');

  // Function to add a new picker
  const handleAddPicker = () => {
    const newPicker: Picker = {
      id: `picker-${Date.now()}`,
      name: `New Picker ${state.pickers.length + 1}`,
      performance: 0,
      target: 100,
      status: 'active',
      hourlyData: Array.from({ length: 9 }, (_, i) => ({
        hour: i + 9,
        lines: 0,
        target: 100,
        efficiency: 0
      })),
      startTime: '09:00',
      endTime: '17:00',
      breaks: []
    };

    // Update local state
    const updatedPickers = [...state.pickers, newPicker];
    setState({
      ...state,
      pickers: updatedPickers
    });
    
    // After local state update, try to update Firestore as well
    try {
      syncToFirestore(updatedPickers);
    } catch (error) {
      // Silent fail on Firestore - local state update already happened
      console.log('Firebase sync failed, but local update succeeded');
    }
    
    setUpdateStatus('New picker added successfully');
  };

  // Separate function to sync to Firestore that doesn't affect UI state
  const syncToFirestore = async (pickers: Picker[]) => {
    try {
      if (!db) {
        console.error('Firestore db is undefined');
        return;
      }
      const sharedStateRef = doc(db, 'sharedStates', 'current');
      await updateDoc(sharedStateRef, {
        pickers: pickers,
        lastSyncTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Firebase sync complete');
    } catch (error) {
      console.log('Firebase sync error (UI not affected):', error);
      // Don't throw or affect UI state - just log the error
    }
  };

  // Handle recording performance for a picker at a specific hour
  const handleRecordPerformance = () => {
    if (!selectedPicker || lines < 0) {
      setUpdateStatus("Please select a picker and enter a valid number of lines");
      return;
    }

    try {
      // Get the current picker
      const pickerToUpdate = state.pickers.find(p => p.id === selectedPicker);
      if (!pickerToUpdate) {
        setUpdateStatus("Selected picker not found");
        return;
      }
      
      // Create a new array with the updated picker
      const updatedPickers = state.pickers.map(picker => {
        if (picker.id === selectedPicker) {
          // Create new hourly data with the updated hour
          const newHourlyData = picker.hourlyData.map(hourData => {
            if (hourData.hour === selectedHour) {
              return {
                ...hourData,
                lines: lines
              };
            }
            return hourData;
          });
          
          // Calculate new total performance
          const newTotalLines = newHourlyData.reduce((sum, hour) => sum + hour.lines, 0);
          
          // Return new picker object with updated values
          return {
            ...picker,
            performance: newTotalLines,
            hourlyData: newHourlyData
          };
        }
        return picker;
      });
      
      // Update the state in parent component
      setState({
        ...state,
        pickers: updatedPickers
      });
      
      // After local state update is complete, try to sync to Firestore
      try {
        syncToFirestore(updatedPickers);
      } catch (error) {
        // Silent fail - local update already happened
        console.log('Firebase sync failed, but local update succeeded');
      }
      
      // Reset form and show success message
      setLines(0);
      setUpdateStatus(`Successfully recorded ${lines} lines for hour ${selectedHour}:00`);
    } catch (error) {
      console.error("Error recording performance:", error);
      setUpdateStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Picker Management</h2>
        <button 
          onClick={handleAddPicker}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Add New Picker
        </button>
      </div>

      {/* Record Performance Form */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Record Performance</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleRecordPerformance();
        }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Picker
              </label>
              <select
                value={selectedPicker}
                onChange={(e) => setSelectedPicker(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a picker</option>
                {state.pickers.map(picker => (
                  <option key={picker.id} value={picker.id}>
                    {picker.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hour
              </label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {Array.from({ length: 9 }, (_, i) => i + 9).map(hour => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lines Picked
              </label>
              <input
                type="number"
                value={lines}
                onChange={(e) => setLines(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!selectedPicker || isUpdating}
                className={`w-full p-2 rounded-lg text-white ${
                  !selectedPicker || isUpdating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdating ? 'Recording...' : 'Record'}
              </button>
            </div>
          </div>
          
          {updateStatus && (
            <div className={`mt-3 p-2 rounded text-sm ${
              updateStatus.includes('Error') 
                ? 'bg-red-100 text-red-800' 
                : updateStatus.includes('Success') 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {updateStatus}
            </div>
          )}
        </form>
      </div>

      {/* Horizontal scrollable picker list */}
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-4 min-w-max">
          {state.pickers.map(picker => (
            <div 
              key={picker.id}
              className={`bg-white border rounded-lg shadow-md p-4 min-w-[280px] ${
                picker.status === 'active' 
                  ? 'border-green-400' 
                  : picker.status === 'break' 
                    ? 'border-amber-400' 
                    : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{picker.name}</h3>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    picker.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : picker.status === 'break' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {picker.status.charAt(0).toUpperCase() + picker.status.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => onEdit(picker)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => onDelete(picker.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Target:</span>
                <span className="font-medium">{picker.target} lines</span>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Current:</span>
                <span className="font-medium">{picker.performance} lines</span>
              </div>

              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-600">Efficiency:</span>
                <span className={`font-medium ${
                  (picker.performance / picker.target) >= 1 
                    ? 'text-green-600' 
                    : (picker.performance / picker.target) >= 0.8 
                      ? 'text-amber-600' 
                      : 'text-red-600'
                }`}>
                  {Math.round((picker.performance / picker.target) * 100)}%
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Hourly Breakdown</h4>
                {[9, 11, 13, 15].map(hour => {
                  const hourData = picker.hourlyData.find(h => h.hour === hour);
                  return (
                    <div key={hour} className="flex justify-between text-xs">
                      <span>{hour}:00</span>
                      <span className={`${
                        hourData && (hourData.lines / hourData.target) >= 1 
                          ? 'text-green-600' 
                          : hourData && (hourData.lines / hourData.target) >= 0.8 
                            ? 'text-amber-600' 
                            : 'text-red-600'
                      }`}>
                        {hourData ? hourData.lines : 0} lines
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      (picker.performance / picker.target) >= 1 
                        ? 'bg-green-500' 
                        : (picker.performance / picker.target) >= 0.8 
                          ? 'bg-amber-500' 
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((picker.performance / picker.target) * 100))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span>{Math.round((picker.performance / picker.target) * 100)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HorizontalPickerList; 