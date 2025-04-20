'use client';

import React from 'react';

interface HourlyMetrics {
  hour: number;
  lines: number;
  target: number;
  targetPerPicker: number;
  pickerCount: number;
  completionRate: number;
  consistencyScore: number;
  rating: string;
  ratingColor: string;
  deficit: number;
  cumulativeLines?: number;
  cumulativeTarget?: number;
  hourlyTarget?: number;
}

interface HourAnalysisCardProps {
  hourlyMetrics: HourlyMetrics;
}

const HourAnalysisCard: React.FC<HourAnalysisCardProps> = ({ hourlyMetrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-500">Lines Picked</h3>
        <p className="text-2xl font-bold text-blue-600">{hourlyMetrics.lines.toLocaleString()}</p>
        <div className="text-xs text-gray-600">for this hour</div>
        <div className="mt-2 text-sm flex flex-col">
          <span className="text-gray-700">
            {hourlyMetrics.cumulativeLines?.toLocaleString() || 0} lines total so far
          </span>
          <span className={hourlyMetrics.deficit <= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {hourlyMetrics.deficit <= 0 
              ? 'Daily target complete!' 
              : `Deficit: ${hourlyMetrics.deficit.toLocaleString()} lines remaining`}
          </span>
          <span className="text-gray-700 mt-1">
            Hourly Target: {hourlyMetrics.hourlyTarget || hourlyMetrics.targetPerPicker} lines per picker
          </span>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
        <p className="text-2xl font-bold text-green-600">{hourlyMetrics.completionRate.toFixed(1)}%</p>
        <div className="mt-2 text-sm">
          <span className={`${hourlyMetrics.ratingColor}`}>
            {hourlyMetrics.rating}
          </span>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-500">Team Consistency</h3>
        <p className="text-2xl font-bold text-purple-600">{hourlyMetrics.consistencyScore.toFixed(1)}/100</p>
        <div className="mt-2 text-sm">
          <span className="text-gray-600">
            {hourlyMetrics.consistencyScore > 80 ? 'Highly consistent' : 
             hourlyMetrics.consistencyScore > 60 ? 'Moderately consistent' : 
             'Inconsistent'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HourAnalysisCard; 