'use client';

import { useState, useEffect } from 'react';
import { DashboardState, PerformanceMetrics } from '@/lib/types/warehouse';
import { 
  getProgressColor, 
  getStatusText, 
  getShiftProgressPercentage,
  getRemainingShiftTime,
  prepareChartData
} from '@/lib/utils/warehouseUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PerformanceDisplayProps {
  state: DashboardState;
  performanceMetrics: PerformanceMetrics;
}

const PerformanceDisplay = ({ state, performanceMetrics }: PerformanceDisplayProps) => {
  const [shiftProgress, setShiftProgress] = useState({
    percentage: 0,
    remainingTime: '',
    status: ''
  });

  useEffect(() => {
    const updateProgress = () => {
      const percentage = getShiftProgressPercentage();
      const remainingTime = getRemainingShiftTime();
      const status = getStatusText(percentage);
      
      setShiftProgress({
        percentage,
        remainingTime,
        status
      });
    };

    updateProgress();
    const interval = setInterval(updateProgress, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const chartData = prepareChartData(state.pickers, state.hourlyData);

  return (
    <div className="space-y-4">
      {/* Shift Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#155A8A]">Total Lines</h3>
          <p className="text-2xl font-bold text-[#0A2D4D]">{performanceMetrics.totalLines}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#155A8A]">Average Lines/Picker</h3>
          <p className="text-2xl font-bold text-[#0A2D4D]">
            {performanceMetrics.averageLinesPerPicker.toFixed(1)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#155A8A]">Efficiency Score</h3>
          <p className="text-2xl font-bold text-[#0A2D4D]">
            {performanceMetrics.efficiencyScore.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Shift Tracker */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-[#155A8A]">Shift Progress</h3>
          <span className="text-sm text-[#155A8A]">{shiftProgress.remainingTime} remaining</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full"
            style={{
              width: `${shiftProgress.percentage}%`,
              backgroundColor: getProgressColor(shiftProgress.percentage)
            }}
          />
        </div>
        <p className="mt-2 text-sm text-[#155A8A]">
          Status: {shiftProgress.status}
        </p>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#155A8A] mb-4">Hourly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4A90E2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#155A8A] mb-4">Top Performers</h3>
          <div className="space-y-2">
            {state.pickers
              .sort((a, b) => b.performance - a.performance)
              .slice(0, 3)
              .map((picker, index) => (
                <div
                  key={picker.id}
                  className="flex items-center justify-between p-2 bg-[#B8D8F2] rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{index + 1}.</span>
                    <span className="font-medium text-[#0A2D4D]">{picker.name}</span>
                  </div>
                  <span className="text-[#155A8A]">{picker.performance} lines</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-[#155A8A] mb-4">Performance Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-[#0A2D4D] mb-2">Best Performer</h4>
            <div className="bg-[#B8D8F2] p-3 rounded-lg">
              <p className="text-[#155A8A]">
                {performanceMetrics.bestPerformer?.name ? (
                  `${performanceMetrics.bestPerformer.name}: ${performanceMetrics.bestPerformer.lines} lines`
                ) : (
                  'No data available'
                )}
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-[#0A2D4D] mb-2">Worst Performer</h4>
            <div className="bg-[#B8D8F2] p-3 rounded-lg">
              <p className="text-[#155A8A]">
                {performanceMetrics.worstPerformer?.name ? (
                  `${performanceMetrics.worstPerformer.name}: ${performanceMetrics.worstPerformer.lines} lines`
                ) : (
                  'No data available'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDisplay; 