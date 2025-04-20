'use client';

import React, { useState } from 'react';
import { Picker } from '@/lib/types/warehouse';

interface ShiftPerformanceCardsProps {
  pickers: Picker[];
}

export default function ShiftPerformanceCards({ pickers }: ShiftPerformanceCardsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  console.log("ShiftPerformanceCards rendering with pickers:", pickers.map(p => ({
    id: p.id,
    name: p.name,
    performance: p.performance,
    target: p.target
  })));

  const sortedPickers = [...pickers].sort((a, b) => b.performance - a.performance);
  const worstPerformer = [...pickers].sort((a, b) => a.performance - b.performance)[0];

  const calculateRequiredRate = (picker: Picker) => {
    const currentHour = new Date().getHours();
    const remainingHours = 17 - currentHour; // Assuming shift ends at 17:00
    const remainingTarget = picker.target - picker.performance;
    if (remainingHours <= 0) return 0;
    return Math.ceil(remainingTarget / remainingHours);
  };

  const renderStars = (percentage: number) => {
    const stars = Math.round(percentage * 5 / 100);
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span 
            key={i} 
            className={`transition-all duration-300 ${i < stars ? 'text-yellow-400 text-sm' : 'text-gray-300 text-sm'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Generate performance aura class based on percentage
  const getPerformanceAura = (percentage: number) => {
    if (percentage >= 100) return 'aura-success';
    if (percentage >= 80) return 'aura-warning';
    return 'aura-danger';
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Container classes based on fullscreen state
  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-white p-6 overflow-auto" 
    : "h-[calc(100vh-12rem)] flex flex-col";

  return (
    <div className={containerClasses}>
      {/* Header with fullscreen toggle and back button */}
      <div className="flex justify-between items-center mb-4">
        {isFullscreen && (
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        )}
        
        {!isFullscreen && (
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Fullscreen</span>
          </button>
        )}
      </div>
      
      {isFullscreen && (
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Team Performance Dashboard</h1>
      )}
      
      {/* Top Performers Row */}
      <div className={`grid grid-cols-4 gap-2 mb-3 ${isFullscreen ? 'xl:gap-6' : ''}`}>
        {/* Top Picker Card */}
        <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 shadow-md border border-blue-200 hover-scale transition-all-smooth ${sortedPickers[0] ? getPerformanceAura((sortedPickers[0].performance / sortedPickers[0].target) * 100) : ''} animate-bounce-in ${isFullscreen ? 'p-5' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-yellow-500 text-2xl mr-1">🏆</span>
              <h3 className={`font-extrabold text-blue-800 ${isFullscreen ? 'text-2xl' : 'text-xl'}`}>TOP PICKER</h3>
            </div>
            <div className="text-xs font-medium bg-blue-100 px-1 py-0.5 rounded-full">
              Target: {sortedPickers[0]?.target || 0}
            </div>
          </div>
          <h4 className={`font-bold text-blue-900 truncate mt-2 ${isFullscreen ? 'text-2xl' : 'text-xl'}`} title={sortedPickers[0]?.name}>
            {sortedPickers[0]?.name || 'N/A'}
          </h4>
          <div className="flex justify-between items-end mt-2">
            <div className={`font-bold text-blue-700 transition-all duration-500 ${isFullscreen ? 'text-5xl' : 'text-4xl'}`}>
              {sortedPickers[0]?.performance || 0}
            </div>
            <div className="text-sm font-bold text-blue-600">
              {((sortedPickers[0]?.performance || 0) / (sortedPickers[0]?.target || 1) * 100).toFixed(1)}% complete
            </div>
          </div>
          {renderStars((sortedPickers[0]?.performance || 0) / (sortedPickers[0]?.target || 1) * 100)}
        </div>

        {/* Runner Up Card */}
        <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 shadow-md border border-blue-200 hover-scale transition-all-smooth ${sortedPickers[1] ? getPerformanceAura((sortedPickers[1].performance / sortedPickers[1].target) * 100) : ''} ${isFullscreen ? 'p-5' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-1">🥈</span>
              <h3 className={`font-bold text-blue-800 ${isFullscreen ? 'text-2xl' : 'text-xl'}`}>RUNNER UP</h3>
            </div>
            <div className="text-xs font-medium bg-blue-100 px-1 py-0.5 rounded-full">
              Target: {sortedPickers[1]?.target || 0}
            </div>
          </div>
          <h4 className={`font-bold text-blue-900 truncate mt-2 ${isFullscreen ? 'text-2xl' : 'text-xl'}`} title={sortedPickers[1]?.name}>
            {sortedPickers[1]?.name || 'N/A'}
          </h4>
          <div className="flex justify-between items-end mt-2">
            <div className={`font-bold text-blue-700 transition-all duration-500 ${isFullscreen ? 'text-5xl' : 'text-4xl'}`}>
              {sortedPickers[1]?.performance || 0}
            </div>
            <div className="text-sm font-bold text-blue-600">
              {((sortedPickers[1]?.performance || 0) / (sortedPickers[1]?.target || 1) * 100).toFixed(1)}% complete
            </div>
          </div>
          {renderStars((sortedPickers[1]?.performance || 0) / (sortedPickers[1]?.target || 1) * 100)}
        </div>

        {/* Third Place Card */}
        <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 shadow-md border border-blue-200 hover-scale transition-all-smooth ${sortedPickers[2] ? getPerformanceAura((sortedPickers[2].performance / sortedPickers[2].target) * 100) : ''} ${isFullscreen ? 'p-5' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-1">🥉</span>
              <h3 className={`font-bold text-blue-800 ${isFullscreen ? 'text-2xl' : 'text-xl'}`}>3RD PLACE</h3>
            </div>
            <div className="text-xs font-medium bg-blue-100 px-1 py-0.5 rounded-full">
              Target: {sortedPickers[2]?.target || 0}
            </div>
          </div>
          <h4 className={`font-bold text-blue-900 truncate mt-2 ${isFullscreen ? 'text-2xl' : 'text-xl'}`} title={sortedPickers[2]?.name}>
            {sortedPickers[2]?.name || 'N/A'}
          </h4>
          <div className="flex justify-between items-end mt-2">
            <div className={`font-bold text-blue-700 transition-all duration-500 ${isFullscreen ? 'text-5xl' : 'text-4xl'}`}>
              {sortedPickers[2]?.performance || 0}
            </div>
            <div className="text-sm font-bold text-blue-600">
              {((sortedPickers[2]?.performance || 0) / (sortedPickers[2]?.target || 1) * 100).toFixed(1)}% complete
            </div>
          </div>
          {renderStars((sortedPickers[2]?.performance || 0) / (sortedPickers[2]?.target || 1) * 100)}
        </div>

        {/* Last Place Card */}
        <div className={`bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 shadow-md border border-red-200 hover-scale transition-all-smooth animate-warning-pulse ${isFullscreen ? 'p-5' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-yellow-500 text-2xl mr-1">⚠️</span>
              <h3 className={`font-bold text-red-800 ${isFullscreen ? 'text-2xl' : 'text-xl'}`}>FALLING BEHIND</h3>
            </div>
            <div className="text-xs font-medium bg-red-100 px-1 py-0.5 rounded-full">
              Target: {worstPerformer?.target || 0}
            </div>
          </div>
          <h4 className={`font-bold text-red-900 truncate mt-2 ${isFullscreen ? 'text-2xl' : 'text-xl'}`} title={worstPerformer?.name}>
            {worstPerformer?.name || 'N/A'}
          </h4>
          <div className="flex justify-between items-end mt-2">
            <div className={`font-bold text-red-700 transition-all duration-500 ${isFullscreen ? 'text-5xl' : 'text-4xl'}`}>
              {worstPerformer?.performance || 0}
            </div>
            <div className="text-sm font-bold text-red-600">
              {((worstPerformer?.performance || 0) / (worstPerformer?.target || 1) * 100).toFixed(1)}% complete
            </div>
          </div>
          {renderStars(0)} {/* 0 stars for worst performer */}
          
          {/* Alert for worst performer */}
          <div className="mt-2 text-sm font-bold text-red-700 bg-red-50 p-1.5 rounded flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            Needs {calculateRequiredRate(worstPerformer)} lines/hour to catch up
          </div>
        </div>
      </div>

      {/* Individual Picker Cards - Horizontal layout using flex-row and flex-wrap */}
      <div className={`flex flex-row flex-wrap gap-2 overflow-auto ${isFullscreen ? 'gap-4 mt-8' : ''}`}>
        {pickers.map(picker => {
          const percentage = (picker.performance / picker.target) * 100;
          const requiredRate = calculateRequiredRate(picker);
          
          return (
            <div 
              key={picker.id} 
              className={`bg-white rounded-lg shadow-sm p-2 border border-gray-200 hover-scale transition-all-smooth ${
                isFullscreen ? 'w-[220px] p-4' : 'w-[180px]'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-blue-900 truncate ${isFullscreen ? 'text-lg' : 'text-md'}`} title={picker.name}>{picker.name}</h3>
                <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Target: {picker.target}</span>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <div>
                  <div className={`font-bold text-blue-700 ${isFullscreen ? 'text-3xl' : 'text-2xl'}`}>{picker.performance}</div>
                  <div className="text-xs text-gray-600">of {picker.target} lines</div>
                </div>
                <div className={`text-xs font-bold ${percentage >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentage.toFixed(1)}% {percentage >= 100 ? '✓' : ''}
                </div>
              </div>

              {/* Progress bar with animation */}
              <div className={`mt-1 bg-gray-200 rounded-full overflow-hidden ${isFullscreen ? 'h-3' : 'h-2'}`}>
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${
                    percentage >= 100 ? 'bg-green-500' : 
                    percentage >= 80 ? 'bg-amber-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round(percentage))}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-1">
                {renderStars(percentage)}
                {percentage < 100 && (
                  <div className="text-xs font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">
                    Need {requiredRate}/hr
                  </div>
                )}
              </div>
              
              <div className="mt-1 grid grid-cols-4 gap-1 text-xs">
                {[9, 11, 13, 15].map(hour => {
                  const hourData = picker.hourlyData.find(h => h.hour === hour);
                  return (
                    <div key={hour} className="flex flex-col items-center border border-gray-100 rounded bg-gray-50">
                      <div className="text-gray-500">{hour}h</div>
                      <div className="font-bold">{hourData?.lines || 0}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Fullscreen overlay toggle button (always visible in corner when in normal mode) */}
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