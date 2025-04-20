'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DashboardState, PerformanceMetrics, Picker, HourlyData } from '@/lib/types/warehouse';
import EnhancedPerformanceDisplay from './EnhancedPerformanceDisplay';
import HourAnalysisCard from './HourAnalysisCard';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Import the HourlyMetrics interface
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
  accelerationNeeded?: number;
  hourlyTarget?: number;
}

interface ManagementAnalyticsViewProps {
  state: DashboardState;
  performanceMetrics: PerformanceMetrics;
  onBackToMain: () => void;
  setState: (state: DashboardState) => void;
}

// Define a proper type for labor utilization data
interface LaborUtilizationData {
  hour: string;
  'Utilized Labor %': number;
  'Idle Labor %': number;
}

const ManagementAnalyticsView: React.FC<ManagementAnalyticsViewProps> = ({
  state,
  performanceMetrics,
  onBackToMain,
  setState
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [chartData, setChartData] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Ensure performanceMetrics is properly initialized with default values if needed
  const safePerformanceMetrics = useMemo(() => {
    if (!performanceMetrics) {
      console.warn('Performance metrics is undefined, using default values');
      return {
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
      };
    }
    return performanceMetrics;
  }, [performanceMetrics]);
  
  // Effect to update chart data when state changes
  useEffect(() => {
    // Calculate the correct hourly target per picker
    const activePickers = state.pickers.filter(p => p.status === 'active').length;
    const effectivePickers = activePickers > 0 ? activePickers : state.pickers.length;
    
    // Calculate daily target per picker and convert to hourly
    const dailyTargetPerPicker = state.targetLinesPerHour * 8; // Convert hourly to daily
    const hourlyTargetPerPicker = dailyTargetPerPicker / 8; // Then back to hourly for clarity
    
    // Total hourly target for all pickers
    const totalHourlyTarget = hourlyTargetPerPicker * effectivePickers;
    
    const newChartData = state.hourlyData.map(hour => ({
      hour: `${hour.hour}:00`,
      rate: hour.lines || 0,
      target: totalHourlyTarget || 0, // Correct hourly target for all pickers
      efficiency: hour.efficiency ? (hour.efficiency * 100).toFixed(1) : '0.0'
    }));
    
    setChartData(newChartData);
    console.log('Chart data updated with corrected target:', newChartData);
  }, [state.hourlyData, state.targetLinesPerHour, state.pickers]);
  
  // Calculate team consistency score based on the picked lines for the given hour
  const calculateTeamConsistency = (selectedHour: number) => {
    try {
      // Get all active pickers with data for the selected hour
      const pickersWithHourData = state.pickers
        .filter(p => p.status === 'active')
        .map(picker => {
          const hourData = picker.hourlyData.find(h => h.hour === selectedHour);
          return {
            name: picker.name,
            lines: hourData ? hourData.lines : 0,
            target: state.targetLinesPerHour
          };
        });
      
      // If no pickers with data, return default
      if (pickersWithHourData.length === 0) return 80; // Default consistency
      
      // Calculate standard deviation of efficiency percentages
      const efficiencies = pickersWithHourData.map(p => 
        p.target > 0 ? (p.lines / p.target) * 100 : 0
      );
      
      const avgEfficiency = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length;
      
      // Calculate standard deviation
      const squaredDiffs = efficiencies.map(eff => Math.pow(eff - avgEfficiency, 2));
      const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
      const stdDev = Math.sqrt(avgSquaredDiff);
      
      // Convert standard deviation to a consistency score (lower std dev = higher consistency)
      // Map std dev range of 0-50 to consistency score of 100-0 (inverted)
      const maxStdDev = 50; // Max expected std dev
      const consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / maxStdDev) * 100));
      
      return Math.round(consistencyScore);
    } catch (error) {
      console.error('Error calculating team consistency:', error);
      return 80; // Default fallback value
    }
  };

  // Calculate metrics for a specific hour
  const hourlyMetrics = (selectedHour: number): HourlyMetrics => {
    // Get active pickers with targets
    const activePickers = state.pickers.filter(p => p.status === 'active').length;
    const totalPickerTargets = state.pickers
      .filter(p => p.status === 'active')
      .reduce((sum, picker) => sum + (picker.target || 0), 0);
    
    // Calculate daily target per picker based on all active pickers and their targets
    const dailyTargetPerPicker = activePickers > 0 && totalPickerTargets > 0
      ? totalPickerTargets / activePickers  // Daily target per picker
      : state.targetLinesPerHour * 8; // Fall back to default daily target (hourly × 8)
    
    // Calculate hourly target per picker (daily target divided by 8-hour shift)
    const targetPerPicker = Math.round(dailyTargetPerPicker / 8);
    
    const totalTargetPerHour = targetPerPicker * activePickers;
    const totalDailyTarget = dailyTargetPerPicker * activePickers; // Use daily target directly
    
    const pickerCount = activePickers;
    
    // Calculate lines picked for this hour across all pickers
    const linesPicked = state.pickers.reduce((total, picker) => {
      if (picker.status === 'active') {
        const hourData = picker.hourlyData.find(h => h.hour === selectedHour);
        if (hourData) {
          return total + hourData.lines;
        }
      }
      return total;
    }, 0);
    
    // Calculate cumulative lines picked up to and including this hour
    let cumulativeLines = 0;
    let cumulativeTarget = 0;
    
    // Start from hour 9 (first hour) and accumulate up to selected hour
    for (let hour = 9; hour <= selectedHour; hour++) {
      // Add lines picked in this hour across all pickers
      const hourLines = state.pickers.reduce((total, picker) => {
        if (picker.status === 'active') {
          const hourData = picker.hourlyData.find(h => h.hour === hour);
          if (hourData) {
            return total + hourData.lines;
          }
        }
        return total;
      }, 0);
      
      cumulativeLines += hourLines;
      // Add target for this hour
      cumulativeTarget += totalTargetPerHour;
    }
    
    // DEFICIT CALCULATION: Total remaining lines needed to reach the full daily target
    // This is the key metric that indicates how many more lines need to be picked
    // to meet the daily goal, calculated as: (total daily target) - (cumulative lines picked so far)
    const deficit = Math.max(0, totalDailyTarget - cumulativeLines);

    // Calculate completion rate for this hour
    const completionRate = totalTargetPerHour > 0 ? Math.min(100, Math.round((linesPicked / totalTargetPerHour) * 100)) : 0;
    
    // Calculate team consistency
    const consistencyScore = calculateTeamConsistency(selectedHour);
    
    // Calculate acceleration needed to make up any deficit
    const remainingHours = Math.max(0, 17 - selectedHour);
    const accelerationNeeded = remainingHours > 0 && deficit > 0 
      ? ((deficit / remainingHours) / totalTargetPerHour) * 100 - 100
      : 0;
    
    // Determine rating based on completion rate
    const getRating = (rate: number) => {
      if (rate >= 100) return { rating: 'Excellent', color: 'text-green-600' };
      if (rate >= 85) return { rating: 'Good', color: 'text-blue-600' };
      if (rate >= 70) return { rating: 'Acceptable', color: 'text-yellow-600' };
      if (rate >= 50) return { rating: 'Needs Improvement', color: 'text-orange-600' };
      return { rating: 'Critical', color: 'text-red-600' };
    };
    
    const { rating, color } = getRating(completionRate);
    
    return {
      hour: selectedHour,
      lines: linesPicked,
      target: totalTargetPerHour,
      targetPerPicker,
      pickerCount,
      completionRate,
      consistencyScore,
      rating,
      ratingColor: color,
      deficit: Math.round(deficit),
      cumulativeLines,
      cumulativeTarget,
      accelerationNeeded,
      hourlyTarget: targetPerPicker
    };
  };

  // Calculate projected end-of-shift metrics
  const projectedMetrics = useMemo(() => {
    try {
      // Get current hour and ensure it's within working hours (9-17)
      const now = new Date();
      const currentHour = now.getHours();
      console.log('Current time:', now.toLocaleTimeString(), 'Current hour:', currentHour);
      
      // Calculate remaining hours in the shift (from current time until 5pm/17:00)
      const remainingHours = Math.max(0, 17 - currentHour);
      console.log('Remaining hours in shift:', remainingHours);
      
      // If shift is over, just return actual totals
      if (remainingHours <= 0) {
        console.log('Shift is over, returning actual totals');
        // Calculate total target for the day correctly
        const activePickers = state.pickers.filter(p => p.status === 'active').length;
        const effectivePickers = activePickers || state.pickers.length; // Use number of active pickers or all pickers if none are active
        
        // Calculate daily target directly - targetLinesPerHour is hourly, multiply by 8 for daily
        const hourlyTargetPerPicker = state.targetLinesPerHour;
        const totalTarget = effectivePickers * hourlyTargetPerPicker * 8; // 8 hour shift
        
        const totalLines = safePerformanceMetrics.totalLines || 0;
        
        return {
          projectedTotal: totalLines,
          completionPercentage: totalTarget > 0 ? (totalLines / totalTarget) * 100 : 0,
          onTrack: totalLines >= totalTarget
        };
      }

      // Only use data from active pickers for projections
      const activePickers = state.pickers.filter(p => p.status === 'active').length;
      const effectivePickers = activePickers > 0 ? activePickers : state.pickers.length;
      console.log('Effective pickers for projection:', effectivePickers);
      
      // Calculate current rate from active hours (average lines per hour per picker)
      const averageLinesPerHour = 
        safePerformanceMetrics && typeof safePerformanceMetrics.averageLinesPerHour === 'number' 
          ? safePerformanceMetrics.averageLinesPerHour 
          : 0;
      
      console.log('Average lines per hour per picker:', averageLinesPerHour);
      
      // Use a fallback rate if the average lines per hour is not available or zero
      const currentRate = averageLinesPerHour > 0 
        ? averageLinesPerHour 
        : state.targetLinesPerHour * 0.7; // Assume 70% efficiency if no data
      
      console.log('Current rate used for projection:', currentRate);
      
      // Project additional lines based on current rate and remaining hours
      // This is: (lines per hour per picker) × (number of pickers) × (remaining hours)
      const projectedAdditional = currentRate * effectivePickers * remainingHours;
      console.log('Projected additional lines:', projectedAdditional);
      
      const totalLines = safePerformanceMetrics.totalLines || 0;
      console.log('Current total lines:', totalLines);
      
      const projectedTotal = totalLines + projectedAdditional;
      console.log('Final projected total:', projectedTotal);
      
      // Calculate total target for the day
      const totalTarget = effectivePickers * state.targetLinesPerHour * 8; // Proper calculation - hourly × 8 hours
      console.log('Total day target:', totalTarget);
      
      return {
        projectedTotal: Math.round(projectedTotal),
        completionPercentage: totalTarget > 0 ? (projectedTotal / totalTarget) * 100 : 0,
        onTrack: projectedTotal >= totalTarget
      };
    } catch (error) {
      console.error('Error calculating projected metrics:', error);
      // Return safe default values if calculation fails
      return {
        projectedTotal: 0,
        completionPercentage: 0,
        onTrack: false
      };
    }
  }, [safePerformanceMetrics, state.pickers, state.targetLinesPerHour]);

  // Prepare trend data for charts
  const trendData = useMemo(() => {
    try {
      // Use the cached chart data that's updated via useEffect
      if (chartData.length > 0) {
        console.log('Using cached chart data for trend:', chartData);
        return chartData;
      }
      
      // Otherwise calculate from scratch
      // Calculate the correct hourly target per picker
      const activePickers = state.pickers.filter(p => p.status === 'active').length;
      const effectivePickers = activePickers > 0 ? activePickers : state.pickers.length;
      
      // Calculate daily target per picker and convert to hourly
      const dailyTargetPerPicker = state.targetLinesPerHour * 8; // Convert hourly to daily
      const hourlyTargetPerPicker = dailyTargetPerPicker / 8; // Then back to hourly for clarity
      
      // Total hourly target for all pickers
      const totalHourlyTarget = hourlyTargetPerPicker * effectivePickers;
      
      // Check if hourlyData exists and has content
      if (!state.hourlyData || state.hourlyData.length === 0) {
        console.log('No hourly data available, generating sample data');
        // Generate sample data for demonstration
        return Array.from({ length: 9 }, (_, i) => {
          const hour = i + 9;
          // For sample data, create a bell curve of productivity
          const efficiency = i < 4 ? i * 10 + 30 : (8 - i) * 10 + 30;
          return {
            hour: `${hour}:00`,
            rate: Math.round(totalHourlyTarget * (efficiency / 100)),
            target: totalHourlyTarget,
            efficiency: efficiency.toFixed(1)
          };
        });
      }
      
      const result = state.hourlyData.map(hour => ({
        hour: `${hour.hour}:00`,
        rate: hour.lines || 0,
        target: totalHourlyTarget || 100, // Ensure there's always a target value
        efficiency: hour.efficiency ? (hour.efficiency * 100).toFixed(1) : '0.0'
      }));
      
      console.log('Generated trend data from scratch:', result);
      return result;
    } catch (error) {
      console.error('Error preparing trend data:', error);
      // Provide sample data as fallback
      return Array.from({ length: 9 }, (_, i) => {
        const hour = i + 9;
        return {
          hour: `${hour}:00`,
          rate: Math.max(0, 50 - Math.abs(i - 4) * 10),
          target: 100,
          efficiency: Math.max(0, 50 - Math.abs(i - 4) * 10).toFixed(1)
        };
      });
    }
  }, [chartData, state.hourlyData, state.targetLinesPerHour, state.pickers]);

  // Calculate current completion percentage (without projection)
  const currentCompletionPercentage = useMemo(() => {
    // Calculate total target for the day
    const activePickers = state.pickers.filter(p => p.status === 'active').length;
    const effectivePickers = activePickers || state.pickers.length;
    
    // Calculate daily target directly
    const hourlyTargetPerPicker = state.targetLinesPerHour;
    const totalTarget = effectivePickers * hourlyTargetPerPicker * 8; // 8 hour shift
    
    // Get current total lines
    const totalLines = safePerformanceMetrics.totalLines || 0;
    
    // Calculate percentage
    return totalTarget > 0 ? (totalLines / totalTarget) * 100 : 0;
  }, [safePerformanceMetrics.totalLines, state.pickers, state.targetLinesPerHour]);

  // Prepare critical alerts
  const criticalAlerts = useMemo(() => {
    try {
      const alerts = [];

      // Low efficiency alert
      if (safePerformanceMetrics.efficiencyScore < 75) {
        alerts.push({
          id: 'efficiency',
          title: 'Low Efficiency',
          description: `Team efficiency is ${safePerformanceMetrics.efficiencyScore.toFixed(1)}%, below target of 90%`,
          severity: 'high'
        });
      }

      // Stalled pickers
      const stalledPickers = state.pickers.filter(picker => {
        const currentHour = new Date().getHours();
        const hourData = picker.hourlyData.find(h => h.hour === currentHour);
        return hourData && hourData.lines < 10; // Less than 10 lines in current hour
      });

      if (stalledPickers.length > 0) {
        alerts.push({
          id: 'stalled',
          title: 'Stalled Pickers',
          description: `${stalledPickers.length} pickers have low activity in the current hour`,
          severity: 'medium'
        });
      }

      // Off-track for daily target
      if (projectedMetrics && !projectedMetrics.onTrack) {
        alerts.push({
          id: 'offtrack',
          title: 'Off Track for Daily Target',
          description: `Projected to complete ${projectedMetrics.completionPercentage.toFixed(1)}% of daily target`,
          severity: 'high'
        });
      }
      
      // Morning slowdown alert
      const morningHours = [9, 10, 11];
      const morningData = state.hourlyData.filter(h => morningHours.includes(h.hour));
      
      // Only calculate morning average if there is enough data
      const morningAvg = morningData.length > 0 
        ? morningData.reduce((sum, h) => sum + (h.efficiency || 0), 0) / morningData.length 
        : 0.7; // Default to moderate efficiency if no data
      
      if (morningAvg < 0.5 && new Date().getHours() < 12 && morningData.length > 0) {
        const metrics = hourlyMetrics(selectedHour);
        const accelerationText = metrics.accelerationNeeded ? 
          `${Math.round(metrics.accelerationNeeded)}%` : 
          'significant';
          
        alerts.push({
          id: 'morningSlowdown',
          title: 'Morning Slowdown Detected',
          description: `Slow morning start may require ${accelerationText} acceleration in remaining hours`,
          severity: 'medium'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error calculating critical alerts:', error);
      return [];
    }
  }, [safePerformanceMetrics, selectedHour, state.hourlyData, state.pickers, state.targetLinesPerHour]);

  // Prepare labor utilization data for the stacked area chart
  const prepareLaborUtilizationData = (data: any[], selectedPickerId: string = 'all'): LaborUtilizationData[] => {
    try {
      // If no data or empty, generate sample data
      if (!data || data.length === 0) {
        console.warn('No data available for labor utilization chart, using sample data');
        // Create a realistic labor utilization sample with a drop after 13:00
        return Array.from({ length: 9 }, (_, i) => {
          const hour = i + 9;
          // Utilization drops after 13:00 (hour index 4)
          const utilizedPercent = i <= 4 ? 
            80 - (i * 5) : // Gradual decrease to 13:00
            30 - ((i-4) * 5); // Sharp decrease after 13:00
          
          return {
            hour: `${hour}:00`,
            'Utilized Labor %': Math.max(0, utilizedPercent),
            'Idle Labor %': Math.min(100, 100 - utilizedPercent)
          };
        });
      }

      console.log('Labor utilization input data:', data);
      
      // Make sure we have all hours from 9:00 to 17:00
      const allHours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      
      // For selected picker or all pickers
      if (selectedPickerId === 'all') {
        // Create a map to store data by hour
        const hourlyDataMap: Record<string, LaborUtilizationData> = {};
        
        // Initialize with zero values for all hours
        allHours.forEach(hourStr => {
          hourlyDataMap[hourStr] = {
            hour: hourStr,
            'Utilized Labor %': 0,
            'Idle Labor %': 100
          };
        });
        
        // Fill in actual data
        data.forEach(hourData => {
          if (!hourData.hour) return;
          
          const hourStr = hourData.hour;
          // Ensure we have valid numbers for calculation
          const rate = typeof hourData.rate === 'number' ? hourData.rate : 0;
          const target = typeof hourData.target === 'number' && hourData.target > 0 ? hourData.target : 100;
          
          // Calculate utilized labor as percentage of target rate
          const utilizedPercent = Math.min(100, Math.round((rate / target) * 100));
          // Idle labor is the remaining percentage
          const idlePercent = 100 - utilizedPercent;
          
          console.log(`Hour ${hourStr}: rate=${rate}, target=${target}, utilized=${utilizedPercent}%, idle=${idlePercent}%`);
          
          // Update the map
          if (hourlyDataMap[hourStr]) {
            hourlyDataMap[hourStr] = {
              hour: hourStr,
              'Utilized Labor %': utilizedPercent,
              'Idle Labor %': idlePercent
            };
          }
        });
        
        // Convert map back to array in correct order
        const result = allHours.map(hour => hourlyDataMap[hour]);
        
        console.log('Labor utilization processed data (all pickers):', result);
        return result;
      } else {
        // Find the selected picker
        const picker = state.pickers.find(p => p.id === selectedPickerId);
        if (!picker) {
          console.warn(`Picker with ID ${selectedPickerId} not found, using sample data`);
          return Array.from({ length: 9 }, (_, i) => {
            const hour = i + 9;
            return {
              hour: `${hour}:00`,
              'Utilized Labor %': Math.max(0, 70 - (i * 8)),
              'Idle Labor %': Math.min(100, 30 + (i * 8))
            };
          });
        }
        
        console.log('Selected picker data:', picker);
        
        // Generate hourly data for this picker, ensuring all hours are present
        const result = allHours.map(hourStr => {
          const hour = parseInt(hourStr);
          
          // Find this picker's hourly data
          const hourData = picker.hourlyData.find(h => h.hour === hour);
          
          // Calculate the picker's target for this hour (ensure it's positive)
          const pickerHourlyTarget = Math.max(1, (picker.target || state.targetLinesPerHour * 8) / 8);
          
          // Ensure we have valid numbers for calculation
          const lines = hourData && typeof hourData.lines === 'number' ? hourData.lines : 0;
          
          // Calculate utilized labor as percentage of target rate
          const utilizedPercent = Math.min(100, Math.round((lines / pickerHourlyTarget) * 100));
          
          // Idle labor is the remaining percentage
          const idlePercent = 100 - utilizedPercent;
          
          console.log(`Picker ${picker.name}, Hour ${hourStr}: lines=${lines}, target=${pickerHourlyTarget}, utilized=${utilizedPercent}%, idle=${idlePercent}%`);
          
          return {
            hour: hourStr,
            'Utilized Labor %': utilizedPercent,
            'Idle Labor %': idlePercent
          };
        });
        
        console.log('Labor utilization processed data (individual picker):', result);
        return result;
      }
    } catch (error) {
      console.error('Error preparing labor utilization data:', error);
      // Return sample data with a realistic pattern (drop after lunch)
      return Array.from({ length: 9 }, (_, i) => {
        const hour = i + 9;
        // Create a pattern where utilization drops after 13:00 (hour index 4)
        const utilizedPercent = i <= 4 ? 
          80 - (i * 5) : // Gradual decrease to 13:00
          30 - ((i-4) * 5); // Sharp decrease after 13:00
        
        return {
          hour: `${hour}:00`,
          'Utilized Labor %': Math.max(0, utilizedPercent),
          'Idle Labor %': Math.min(100, 100 - utilizedPercent)
        };
      });
    }
  };

  // Custom tooltip for Labor Utilization Chart
  const renderLaborUtilizationTooltip = (props: any) => {
    if (!props.active || !props.payload || props.payload.length === 0) {
      return null;
    }

    const data = props.payload[0].payload;

    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-md text-xs">
        <p className="font-semibold">{data.hour}</p>
        <p className="text-green-600">Utilized Labor %: {data['Utilized Labor %']}</p>
        <p className="text-red-400">Idle Labor %: {data['Idle Labor %']}</p>
      </div>
    );
  };

  // State for picker selection in the Labor Utilization chart
  const [laborChartSelectedPicker, setLaborChartSelectedPicker] = useState<string>('all');

  // Render performance charts
  const renderCharts = () => {
    try {
      // Don't render charts if there's no data
      if (!trendData || trendData.length === 0) {
        return (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            <p>No data available for charts</p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Labor Utilization Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Labor Utilization</h3>
              <select
                value={laborChartSelectedPicker}
                onChange={(e) => setLaborChartSelectedPicker(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Pickers</option>
                {state.pickers.map(picker => (
                  <option key={picker.id} value={picker.id}>
                    {picker.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={prepareLaborUtilizationData(trendData, laborChartSelectedPicker)}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  stackOffset="none"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip content={renderLaborUtilizationTooltip} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Utilized Labor %"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    name="Utilized Labor %"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="Idle Labor %"
                    stackId="1"
                    stroke="#f87171"
                    fill="#f87171"
                    name="Idle Labor %"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              This stacked area chart visualizes labor utilization throughout the day, showing how 
              the proportion of idle time changes when picking activity fluctuates.
            </p>
          </div>
          
          {/* Efficiency Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Efficiency Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                  <Legend />
                  <Line
                    name="Efficiency"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#10b981"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    name="Target (100%)"
                    type="monotone"
                    stroke="#d1d5db"
                    strokeDasharray="5 5"
                    dataKey={() => 100}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering charts:', error);
      return (
        <div className="bg-red-50 p-6 rounded-lg text-center text-red-500">
          <p>Error rendering charts. Please check console for details.</p>
        </div>
      );
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : 'min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-4 md:p-8'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with back button, fullscreen toggle, and controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="#4338CA" strokeWidth="1.5"/>
                    <path d="M7 14L9.293 11.707C9.48053 11.5195 9.73484 11.4142 10 11.4142C10.2652 11.4142 10.5195 11.5195 10.707 11.707L13.293 14.293C13.4805 14.4805 13.7348 14.5858 14 14.5858C14.2652 14.5858 14.5195 14.4805 14.707 14.293L17 12" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ${isFullscreen ? 'text-3xl' : 'text-2xl'}`}>
                    Performance Analysis
                  </h1>
                  <p className="text-sm text-gray-600">
                    Smart insights for warehouse optimization
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 9 }, (_, i) => i + 9).map(hour => (
                  <option key={hour} value={hour}>{hour}:00</option>
                ))}
              </select>
              
              <button
                onClick={toggleFullscreen}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  {isFullscreen ? (
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H6a1 1 0 01-1-1v-3zm9-1a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  )}
                </svg>
                <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
              </button>
              
              {/* Only show back button if not in fullscreen, otherwise back is exit fullscreen */}
              {!isFullscreen && (
                <button
                  onClick={onBackToMain}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Back to Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Metrics Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Lines</h3>
              <p className="text-2xl font-bold text-blue-600">{safePerformanceMetrics.totalLines.toLocaleString()}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Efficiency Score</h3>
              <p className="text-2xl font-bold text-green-600">
                {safePerformanceMetrics.efficiencyScore ? safePerformanceMetrics.efficiencyScore.toFixed(1) + '%' : '0%'}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Avg. Lines/Picker</h3>
              <p className="text-2xl font-bold text-purple-600">
                {safePerformanceMetrics.averageLinesPerPicker ? safePerformanceMetrics.averageLinesPerPicker.toFixed(1) : '0'}
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Overall Completion</h3>
              <p className="text-2xl font-bold text-amber-600">{currentCompletionPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 shadow-md">
            <h2 className="text-xl font-bold text-red-800 mb-4">Critical Alerts</h2>
            <div className="space-y-4">
              {criticalAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg ${
                    alert.severity === 'high' 
                      ? 'bg-red-100 border-l-4 border-red-500' 
                      : 'bg-amber-100 border-l-4 border-amber-500'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${
                      alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        alert.severity === 'high' ? 'text-red-800' : 'text-amber-800'
                      }`}>
                        {alert.title}
                      </h3>
                      <p className="text-sm mt-1">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hourly Performance Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Hour {selectedHour}:00 Analysis
          </h2>
          <HourAnalysisCard hourlyMetrics={hourlyMetrics(selectedHour)} />
        </div>

        {/* Performance Charts */}
        <div className="mb-6">
          {renderCharts()}
        </div>

        {/* Enhanced Performance Display Component - for detailed analytics */}
        <EnhancedPerformanceDisplay state={state} performanceMetrics={safePerformanceMetrics} setState={setState} />
      </div>
      
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
};

export default ManagementAnalyticsView; 