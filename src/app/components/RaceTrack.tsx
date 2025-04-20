'use client';

import React, { useState, useMemo } from 'react';
import { getProgressColor } from '@/lib/utils/warehouseUtils';

interface RaceTrackProps {
  pickers: any[]; // This should match the Picker type from warehouse.ts
  shiftDuration: number; // in hours
  shiftElapsed: number; // in hours
  target: number;
}

// Helper function to calculate picker position/progress
const calculatePosition = (picker: any): number => {
  // Use the performance property which is what the dashboard uses to track lines picked
  return picker.performance / (picker.target || 1);
};

export default function RaceTrack({ pickers, shiftDuration, shiftElapsed, target }: RaceTrackProps) {
  const [selectedPicker, setSelectedPicker] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Sort pickers by performance (highest to lowest)
  const sortedPickers = useMemo(() => {
    return [...pickers].sort((a, b) => calculatePosition(b) - calculatePosition(a));
  }, [pickers]);

  // Calculate team average
  const teamAverage = useMemo(() => {
    if (pickers.length === 0) return 0;
    const totalProgress = pickers.reduce((sum, picker) => sum + calculatePosition(picker), 0);
    return totalProgress / pickers.length * 100;
  }, [pickers]);
  
  // Calculate remaining shift time
  const minutesRemaining = Math.round((shiftDuration - shiftElapsed) * 60);
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemaining = minutesRemaining % 60;
  
  // Get status helper
  const getStatus = (progress: number) => {
    if (progress >= 100) return { label: 'Ahead', textColor: 'text-black' };
    if (progress >= 80) return { label: 'On Track', textColor: 'text-black' };
    return { label: 'Behind', textColor: 'text-red-600' };
  };

  // Calculate picker rate - lines per hour
  const getPickerRate = (picker: any): number => {
    if (shiftElapsed <= 0) return 0;
    return Math.round(picker.performance / shiftElapsed);
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Calculate team performance metrics
  const performanceMetrics = useMemo(() => {
    if (pickers.length === 0) return null;
    
    const totalLines = pickers.reduce((sum, p) => sum + p.performance, 0);
    const totalTarget = pickers.reduce((sum, p) => sum + p.target, 0);
    const totalCompletion = Math.round((totalLines / totalTarget) * 100);
    
    const highestPerformer = [...pickers].sort((a, b) => b.performance - a.performance)[0];
    const lowestPerformer = [...pickers].sort((a, b) => a.performance - b.performance)[0];
    
    const pickersAhead = pickers.filter(p => calculatePosition(p) >= 1).length;
    const pickersOnTrack = pickers.filter(p => calculatePosition(p) >= 0.8 && calculatePosition(p) < 1).length;
    const pickersBehind = pickers.filter(p => calculatePosition(p) < 0.8).length;
    
    const projectedEndOfShift = pickers.map(p => {
      const hourlyRate = getPickerRate(p);
      const projected = Math.floor(p.performance + hourlyRate * (shiftDuration - shiftElapsed));
      const shortfall = Math.floor(Math.max(0, p.target - projected));
      
      return {
        name: p.name,
        projected,
        target: p.target,
        shortfall
      };
    });
    
    return {
      totalLines,
      totalTarget,
      totalCompletion,
      highestPerformer,
      lowestPerformer,
      pickersAhead,
      pickersOnTrack,
      pickersBehind,
      projectedEndOfShift
    };
  }, [pickers, shiftDuration, shiftElapsed]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : 'w-full bg-white rounded-lg shadow-md p-4 mb-6 animate-fadeIn'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`${isFullscreen ? 'text-2xl' : 'text-lg'} font-bold`}>Performance Race Track</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            Shift remaining: <span className="font-semibold">{hoursRemaining}h {minsRemaining}m</span>
          </div>
          
          {/* Fullscreen toggle button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors ml-4"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              {isFullscreen ? (
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H6a1 1 0 01-1-1v-3zm9-1a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1h-3z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              )}
            </svg>
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>
      
      {/* Progress markers */}
      <div className="relative w-full h-6 mb-2 flex">
        <div className="absolute left-0 top-0 w-full flex justify-between px-2">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div key={mark} className="text-xs font-semibold text-gray-500">
              {mark}%
            </div>
          ))}
        </div>
      </div>
      
      {/* Team average marker */}
      <div className="relative w-full h-1 mb-4">
        <div 
          className="absolute top-0 h-8 w-0.5 bg-blue-500 shadow-md transition-all duration-300"
          style={{ 
            left: `${Math.min(teamAverage, 100)}%`,
            zIndex: 10
          }}
        >
          <div className="absolute -top-5 -translate-x-1/2 text-xs font-semibold bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
            Team Avg
          </div>
        </div>
        
        {/* Progress grid lines */}
        {[25, 50, 75].map((mark) => (
          <div 
            key={mark}
            className="absolute top-0 h-full w-px bg-blue-100"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>
      
      {/* Picker tracks */}
      <div className={`space-y-3 ${isFullscreen ? 'mb-8' : ''}`}>
        {sortedPickers.map((picker, index) => {
          const progress = calculatePosition(picker) * 100;
          const progressCapped = Math.min(progress, 100);
          const status = getStatus(progress);
          
          return (
            <div 
              key={picker.id} 
              className="relative flex items-center gap-2 group"
              onMouseEnter={() => setSelectedPicker(picker.id)}
              onMouseLeave={() => setSelectedPicker(null)}
            >
              {/* Position indicator */}
              <div className="w-6 text-center font-bold text-gray-600">
                #{index + 1}
              </div>
              
              {/* Picker avatar */}
              <div 
                className={`${isFullscreen ? 'h-10 w-10' : 'h-8 w-8'} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md`}
                style={{ backgroundColor: getProgressColor(progress) }}
              >
                {picker.name.slice(0, 2).toUpperCase()}
              </div>
              
              {/* Progress track */}
              <div className={`flex-1 ${isFullscreen ? 'h-8' : 'h-6'} bg-gray-100 rounded-full overflow-hidden shadow-inner relative`}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progressCapped}%`,
                    backgroundColor: getProgressColor(progress),
                    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                    backgroundSize: '1rem 1rem'
                  }}
                />
                
                {/* Status and metrics */}
                <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-3">
                  <div className="flex gap-2 items-center">
                    <span className={`font-semibold ${isFullscreen ? 'text-base' : 'text-sm'} text-gray-800`}>{picker.name}</span>
                    <span className={`${isFullscreen ? 'text-sm' : 'text-xs'} ${status.textColor} font-medium`}>
                      ({status.label})
                    </span>
                  </div>
                  <div className={`${isFullscreen ? 'text-sm' : 'text-xs'} font-bold`}>
                    {Math.round(progress)}%
                  </div>
                </div>
                
                {/* Hover card */}
                {selectedPicker === picker.id && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 w-56 p-3 bg-white rounded-lg shadow-lg animate-fadeIn">
                    <div className="text-sm font-bold mb-1">{picker.name}</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-gray-500">Lines picked:</div>
                      <div className="text-right font-semibold">{picker.performance}</div>
                      <div className="text-gray-500">Today&apos;s target:</div>
                      <div className="text-right font-semibold">{picker.target}</div>
                      <div className="text-gray-500">Current rate:</div>
                      <div className="text-right font-semibold">{getPickerRate(picker)} lines/hr</div>
                      <div className="text-gray-500">Status:</div>
                      <div className="text-right font-semibold capitalize">{picker.status}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Finish line */}
              <div className={`${isFullscreen ? 'h-10 w-10' : 'h-8 w-8'} rounded-full bg-white flex items-center justify-center`}>
                <div className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} rounded-full bg-black flex items-center justify-center overflow-hidden`} style={{ 
                  backgroundImage: 'linear-gradient(45deg, #000 25%, #fff 25%, #fff 50%, #000 50%, #000 75%, #fff 75%, #fff)',
                  backgroundSize: '4px 4px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743-.356l1.918 1.918a12.75 12.75 0 002.743-.356 6.75 6.75 0 006.139-5.6.75.75 0 00-.585-.86 47.865 47.865 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.803 49.803 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.58 45.58 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end mt-4">
        <button 
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {/* Performance Details Panel */}
      {showDetails && performanceMetrics && (
        <div className="mt-4 animate-fadeIn">
          <div className="border-t pt-4">
            <h4 className="font-bold text-sm mb-3">Performance Summary</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Team Progress */}
              <div className="bg-blue-50 p-3 rounded-md">
                <h5 className="text-xs font-semibold text-blue-800 mb-2">Team Progress</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total Lines:</span>
                    <span className="font-medium">{performanceMetrics.totalLines}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Target:</span>
                    <span className="font-medium">{performanceMetrics.totalTarget}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Completion:</span>
                    <span className="font-medium">{performanceMetrics.totalCompletion}%</span>
                  </div>
                </div>
              </div>
              
              {/* Team Status */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h5 className="text-xs font-semibold text-gray-800 mb-2">Team Status</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Ahead:</span>
                    <span className="font-medium">{performanceMetrics.pickersAhead} pickers</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>On Track:</span>
                    <span className="font-medium">{performanceMetrics.pickersOnTrack} pickers</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Behind:</span>
                    <span className="font-medium">{performanceMetrics.pickersBehind} pickers</span>
                  </div>
                </div>
              </div>
              
              {/* Top Performers */}
              <div className="bg-green-50 p-3 rounded-md">
                <h5 className="text-xs font-semibold text-green-800 mb-2">Performance Leaders</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Top Performer:</span>
                    <span className="font-medium">{performanceMetrics.highestPerformer.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rate:</span>
                    <span className="font-medium">{getPickerRate(performanceMetrics.highestPerformer)} lines/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Lines Picked:</span>
                    <span className="font-medium">{performanceMetrics.highestPerformer.performance}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Projected End of Shift */}
            <div className="mt-4">
              <h5 className="text-xs font-semibold text-gray-800 mb-2">Projected End of Shift</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Picker</th>
                      <th className="px-2 py-1 text-right">Projected</th>
                      <th className="px-2 py-1 text-right">Target</th>
                      <th className="px-2 py-1 text-right">Shortfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetrics.projectedEndOfShift.map((p) => (
                      <tr key={p.name} className="border-b border-gray-100">
                        <td className="px-2 py-1">{p.name}</td>
                        <td className="px-2 py-1 text-right">{p.projected}</td>
                        <td className="px-2 py-1 text-right">{p.target}</td>
                        <td className="px-2 py-1 text-right font-medium" style={{
                          color: p.shortfall > 0 ? '#ef4444' : '#16a34a'
                        }}>
                          {p.shortfall > 0 ? p.shortfall : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating fullscreen button for easy access (only visible in normal mode) */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
          title="View fullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>
      )}
    </div>
  );
} 