'use client';

import React, { useMemo } from 'react';
import { Picker } from '@/lib/types/warehouse';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';

interface EndOfShiftProjectionProps {
  pickers: Picker[];
}

export default function EndOfShiftProjection({ pickers }: EndOfShiftProjectionProps) {
  // Calculate projected lines based on current performance
  const calculateProjectedLines = (picker: Picker) => {
    const currentHour = new Date().getHours();
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const totalHours = endHour - startHour;
    const elapsedHours = Math.max(0.1, Math.min(totalHours, currentHour - startHour));
    
    const currentPerformance = picker.performance;
    const hourlyRate = currentPerformance / elapsedHours;
    return Math.round(hourlyRate * totalHours);
  };

  // Prepare data for the gap analysis chart
  const gapAnalysisData = useMemo(() => {
    // Process picker data and calculate gaps
    const processedData = pickers.map(picker => {
      const projected = calculateProjectedLines(picker);
      const target = picker.target;
      
      // Make names consistent
      const nameWithSpace = picker.name.replace(/([a-zA-Z])(\d)/, '$1 $2');
      
      // Calculate shortfall and ensure it's a clean integer
      const shortfall = Math.floor(Math.max(0, target - projected));
      
      return {
        name: nameWithSpace,
        target: target,
        projectedAchievement: Math.floor(Math.min(projected, target)), // Cap achievement at target and ensure integer
        projectedShortfall: shortfall,
        achievement: picker.performance,
        achievementPercent: Math.round((projected / target) * 100)
      };
    });
    
    // Sort by projected achievement percentage (ascending, so worst performers first)
    return [...processedData].sort((a, b) => a.achievementPercent - b.achievementPercent);
  }, [pickers]);

  // Find maximum target value for Y-axis
  const maxValue = useMemo(() => {
    if (gapAnalysisData.length === 0) return 600;
    const maxTarget = Math.max(...gapAnalysisData.map(item => item.target));
    return Math.ceil(maxTarget / 150) * 150; // Round up to nearest 150
  }, [gapAnalysisData]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string> & { payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalProjected = data.projectedAchievement;
      const percentComplete = Math.round((totalProjected / data.target) * 100);
      const status = percentComplete >= 90 ? 'On Track' : 
                     percentComplete >= 70 ? 'At Risk' : 'High Risk';
      const statusColor = percentComplete >= 90 ? 'text-green-600' : 
                         percentComplete >= 70 ? 'text-yellow-600' : 'text-red-600';
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-sm text-blue-600">Projected: {totalProjected} lines</p>
          <p className="text-sm text-gray-600">Target: {data.target} lines</p>
          <p className="text-sm text-red-600">Shortfall: {Math.floor(data.projectedShortfall)} lines</p>
          <p className={`text-sm font-medium ${statusColor}`}>Status: {status}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900">4. Gap Analysis - Projected Shortfall</h2>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={gapAnalysisData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            barGap={0}
            barSize={80}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={true}
              tick={{ fill: '#4B5563', fontSize: 12 }}
            />
            <YAxis 
              domain={[0, maxValue]}
              axisLine={true}
              tick={{ fill: '#4B5563' }}
              ticks={[0, 150, 300, 450, 600]} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ bottom: 0 }} />
            <Bar 
              dataKey="projectedAchievement" 
              name="Projected Achievement" 
              stackId="a" 
              fill="#4338CA" // Deeper blue to match image
            />
            <Bar 
              dataKey="projectedShortfall" 
              name="Projected Shortfall" 
              stackId="a" 
              fill="#EF4444" // Red
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          This stacked bar chart highlights the projected shortfall (in red) against targets, making it 
          immediately clear which pickers are at risk of missing their targets.
        </p>
      </div>
    </div>
  );
} 