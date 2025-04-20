'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { DashboardState, PerformanceMetrics, HourlyData, Picker } from '@/lib/types/warehouse';

interface EnhancedPerformanceDisplayProps {
  state: DashboardState;
  performanceMetrics: PerformanceMetrics;
  setState: (state: DashboardState) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface HourlyChartData {
  hour: string;
  lines: number;
  efficiency: string;
  target: number;
}

interface CumulativeChartData {
  hour: string;
  total: number;
  target: number;
}

const EnhancedPerformanceDisplay = ({
  state,
  performanceMetrics,
  setState
}: EnhancedPerformanceDisplayProps): JSX.Element => {
  const [selectedMetric, setSelectedMetric] = useState<'lines' | 'productivity'>('lines');
  const [selectedPickerId, setSelectedPickerId] = useState<string>('all');

  // Get all hourly data (all pickers combined)
  const allHourlyData = useMemo<HourlyChartData[]>(() => {
    // Count only active pickers
    const activePickers = state.pickers.filter(p => p.status === 'active').length;
    
    // For "All Pickers" view, calculate total daily target from all active pickers
    let totalDailyTarget = 0;
    if (selectedPickerId === 'all') {
      // Sum the target values from all active pickers
      totalDailyTarget = state.pickers
        .filter(p => p.status === 'active')
        .reduce((sum, picker) => sum + (picker.target || state.targetLinesPerHour * 8), 0);
    } else {
      // For individual picker, use their target or default
      const picker = state.pickers.find(p => p.id === selectedPickerId);
      totalDailyTarget = picker?.target || state.targetLinesPerHour * 8;
    }
    
    // Calculate hourly target (divide total daily target by 8 hours)
    const hourlyTarget = Math.round(totalDailyTarget / 8);
    
    console.log('Hourly target calculations:', {
      selectedPickerId,
      activePickers,
      totalDailyTarget,
      hourlyTarget
    });
    
    return (state.hourlyData || [])
      .filter(hour => hour.hour >= 9 && hour.hour <= 17) // Only show work hours
      .map((hour: HourlyData) => ({
        hour: `${hour.hour}:00`,
        lines: Math.round(hour.lines || 0), // Ensure whole numbers
        efficiency: ((hour.efficiency || 0) * 100).toFixed(1),
        target: hourlyTarget
      }));
  }, [state.hourlyData, state.targetLinesPerHour, state.pickers, selectedPickerId]);
  
  // Get a specific picker's hourly data
  const pickerHourlyData = useMemo<HourlyChartData[]>(() => {
    if (selectedPickerId === 'all') {
      return allHourlyData;
    }
    
    const picker = state.pickers.find(p => p.id === selectedPickerId);
    if (!picker) return allHourlyData;
    
    // Calculate the correct hourly target for this picker
    const dailyTarget = picker.target || state.targetLinesPerHour * 8;
    const hourlyTarget = dailyTarget / 8;
    
    return Array.from({ length: 9 }, (_, i) => {
      const hour = i + 9;
      const hourData = picker.hourlyData.find(h => h.hour === hour) || {
        hour,
        lines: 0,
        target: picker.target,
        efficiency: 0
      };
      
      return {
        hour: `${hour}:00`,
        lines: hourData.lines,
        efficiency: ((hourData.efficiency || 0) * 100).toFixed(1),
        target: Math.round(hourlyTarget)
      };
    });
  }, [selectedPickerId, state.pickers, allHourlyData, state.targetLinesPerHour]);
  
  // Prepare data for stacked bar chart with gap calculation
  const stackedHourlyData = useMemo(() => {
    return pickerHourlyData.map(hour => ({
      ...hour,
      gap: Math.max(0, hour.target - hour.lines) // Calculate the gap between target and actual
    }));
  }, [pickerHourlyData]);

  // Calculate heatmap data with completion percentages
  const heatmapData = useMemo(() => {
    return pickerHourlyData.map(hourData => {
      const completionPercentage = hourData.lines / hourData.target * 100;
      // Cap at 100% for visualization purposes
      const cappedPercentage = Math.min(100, completionPercentage);
      
      // Determine color based on percentage (red for low, green for high)
      let colorCategory = '';
      if (cappedPercentage < 20) colorCategory = '0-20%';
      else if (cappedPercentage < 40) colorCategory = '20-40%';
      else if (cappedPercentage < 60) colorCategory = '40-60%';
      else if (cappedPercentage < 80) colorCategory = '60-80%';
      else colorCategory = '80-100%';
      
      // Calculate fill color based on percentage (red to green gradient)
      return {
        ...hourData,
        completionPercentage: cappedPercentage,
        colorCategory,
        // For rendering the actual bar
        value: Math.round(cappedPercentage)
      };
    });
  }, [pickerHourlyData]);

  // Calculate deficit distribution data for pie chart
  const deficitDistributionData = useMemo(() => {
    // Group hours into time blocks
    const timeBlocks = [
      { name: '9:00-11:00', hours: [9, 10], color: '#F59E0B' }, // Amber
      { name: '11:00-13:00', hours: [11, 12], color: '#F97316' }, // Orange
      { name: '13:00-15:00', hours: [13, 14], color: '#EF4444' }, // Red
      { name: '15:00-17:00', hours: [15, 16, 17], color: '#B91C1C' }, // Dark Red
    ];

    // Calculate deficit for each hour
    const hourlyDeficits = pickerHourlyData.map(hourData => {
      const hourNum = parseInt(hourData.hour.split(':')[0]);
      return {
        hour: hourNum,
        deficit: Math.max(0, hourData.target - hourData.lines)
      };
    });

    // Calculate total deficit
    const totalDeficit = hourlyDeficits.reduce((sum, hour) => sum + hour.deficit, 0);
    
    // Group deficits by time block
    return timeBlocks.map(block => {
      const blockDeficit = hourlyDeficits
        .filter(hour => block.hours.includes(hour.hour))
        .reduce((sum, hour) => sum + hour.deficit, 0);
      
      const percentage = totalDeficit > 0 
        ? Math.round((blockDeficit / totalDeficit) * 100) 
        : 0;
      
      return {
        name: block.name,
        value: blockDeficit,
        percentage,
        color: block.color
      };
    });
  }, [pickerHourlyData]);

  // Calculate average target rate
  const averageTargetRate = useMemo(() => {
    if (!pickerHourlyData || pickerHourlyData.length === 0) return 0;
    
    const totalTarget = pickerHourlyData.reduce((sum, hour) => sum + hour.target, 0);
    return Math.round(totalTarget / pickerHourlyData.length);
  }, [pickerHourlyData]);

  // Find best hour for selected picker
  const bestHour = useMemo(() => {
    if (selectedPickerId === 'all') {
      const maxHour = [...allHourlyData].sort((a, b) => b.lines - a.lines)[0];
      return maxHour ? { hour: maxHour.hour, lines: maxHour.lines } : { hour: '', lines: 0 };
    }
    
    const picker = state.pickers.find(p => p.id === selectedPickerId);
    if (!picker) return { hour: '', lines: 0 };
    
    const maxHour = [...picker.hourlyData].sort((a, b) => b.lines - a.lines)[0];
    return maxHour ? { hour: `${maxHour.hour}:00`, lines: maxHour.lines } : { hour: '', lines: 0 };
  }, [selectedPickerId, state.pickers, allHourlyData]);

  const cumulativeData = useMemo<CumulativeChartData[]>(() => {
    let totalLines = 0;
    let cumulativeTarget = 0;
    
    // Count only active pickers
    const activePickers = state.pickers.filter(p => p.status === 'active').length;
    const effectivePickers = selectedPickerId !== 'all' 
      ? 1  // Only one picker selected
      : (activePickers > 0 ? activePickers : state.pickers.length);
    
    console.log('Cumulative chart calculations:', {
      activePickers,
      effectivePickers,
      selectedPickerId
    });
    
    // First, calculate hourly targets based on actual data for each hour
    const hourlyTargets: Record<number, number> = {};
    
    for (let i = 0; i < 9; i++) {
      const hour = i + 9; // 9, 10, 11, ..., 17
      
      // For individual picker view
      if (selectedPickerId !== 'all') {
        const picker = state.pickers.find(p => p.id === selectedPickerId);
        
        if (picker) {
          // Look for target in the picker's hourly data
          const pickerHourData = picker.hourlyData.find(h => h.hour === hour);
          
          // Use picker's target divided by 8 (hours) as the hourly target
          const hourlyTarget = (picker.target || state.targetLinesPerHour) / 8;
          hourlyTargets[hour] = hourlyTarget;
        }
      } 
      // For all pickers view
      else {
        // Find hourly data for this hour
        const hourData = state.hourlyData.find(h => h.hour === hour);
        
        // For target, use active pickers' targets for this hour
        let hourlyTargetForAll = 0;
        
        state.pickers.forEach(picker => {
          if (picker.status === 'active') {
            // Use picker's target if available, otherwise use default
            const pickerHourlyTarget = picker.target / 8 || state.targetLinesPerHour / 8;
            hourlyTargetForAll += pickerHourlyTarget;
          }
        });
        
        // If no active pickers, fall back to default calculation
        if (hourlyTargetForAll === 0) {
          hourlyTargetForAll = state.targetLinesPerHour * effectivePickers;
        }
        
        hourlyTargets[hour] = hourlyTargetForAll;
      }
    }
    
    // Now generate the cumulative data using the hourly targets
    return Array.from({ length: 9 }, (_, i) => {
      const hour = i + 9; // 9, 10, 11, ..., 17
      
      // Find this hour's data
      const hourData = state.hourlyData.find(h => h.hour === hour) || { hour, lines: 0, efficiency: 0 };
      
      // For individual picker view
      if (selectedPickerId !== 'all') {
        const picker = state.pickers.find(p => p.id === selectedPickerId);
        
        if (picker) {
          // Get this picker's hourly data for the current hour
          const pickerHourData = picker.hourlyData.find(h => h.hour === hour);
          
          // Add lines picked this hour to the total
          if (pickerHourData) {
            totalLines += pickerHourData.lines || 0;
          }
        }
      } 
      // For all pickers view
      else {
        // Add actual lines from hourly data
        totalLines += hourData.lines || 0;
      }
      
      // Add this hour's target to cumulative target
      cumulativeTarget += hourlyTargets[hour] || 0;
      
      return {
        hour: `${hour}:00`,
        total: Math.round(totalLines),
        target: Math.round(cumulativeTarget)
      };
    });
  }, [state.hourlyData, state.targetLinesPerHour, state.pickers, selectedPickerId]);

  // Calculate area under the curve for productivity analysis
  const areaUnderCurve = useMemo(() => {
    if (!cumulativeData || cumulativeData.length < 2) 
      return { 
        area: 0,
        targetArea: 0,
        simpleAverage: 0,
        efficiencyRatio: 0,
        interpretation: 'N/A'
      };
    
    // Use trapezoidal rule to calculate area: Area = ∑ (y₁ + y₂) × (x₂ - x₁) / 2
    let area = 0;
    let targetArea = 0;
    let steepestHour = '';
    let maxSlope = 0;
    let flattestHour = '';
    let minSlope = Infinity;
    
    for (let i = 0; i < cumulativeData.length - 1; i++) {
      const current = cumulativeData[i];
      const next = cumulativeData[i + 1];
      
      // Calculate area of trapezoid for actual (blue line)
      const segmentArea = (current.total + next.total) / 2;
      area += segmentArea;
      
      // Calculate area of trapezoid for target (grey line)
      const segmentTargetArea = (current.target + next.target) / 2;
      targetArea += segmentTargetArea;
      
      // Calculate slope (rate of change) to find steepest/flattest sections
      const slope = next.total - current.total;
      
      if (slope > maxSlope) {
        maxSlope = slope;
        steepestHour = `${current.hour} - ${next.hour}`;
      }
      
      if (slope < minSlope && i > 0) { // Skip first hour which might be zero
        minSlope = slope;
        flattestHour = `${current.hour} - ${next.hour}`;
      }
    }
    
    // Get final values from the last data point
    const finalTotal = cumulativeData.length > 0 ? 
      cumulativeData[cumulativeData.length - 1].total : 0;
    
    // Calculate simple average rate (Output/Time)
    const totalHours = 8; // 9:00 to 17:00 = 8 hour workday
    const simpleAverage = Math.round(finalTotal / totalHours);
    
    // Calculate Labor Efficiency Ratio
    const efficiencyRatio = targetArea > 0 ? 
      Math.round((area / targetArea) * 100) : 0;
    
    // Interpret the efficiency ratio
    let interpretation = '';
    if (efficiencyRatio >= 90) {
      interpretation = 'Excellent efficiency with output closely matching or exceeding targets.';
    } else if (efficiencyRatio >= 70) {
      interpretation = 'Good efficiency with output meeting most targets.';
    } else if (efficiencyRatio >= 50) {
      interpretation = 'Moderate efficiency with output meeting about half of targets.';
    } else {
      interpretation = 'Low efficiency signals systemic issues in the picking process.';
    }
    
    return { 
      area: Math.round(area),
      targetArea: Math.round(targetArea),
      finalTotal: Math.round(finalTotal),
      simpleAverage,
      steepestHour,
      flattestHour,
      maxSlope: Math.round(maxSlope),
      minSlope: Math.round(minSlope),
      efficiencyRatio,
      interpretation
    };
  }, [cumulativeData]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Performance Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Performance vs. Target by Hour</h3>
            <select
              value={selectedPickerId}
              onChange={(e) => setSelectedPickerId(e.target.value)}
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
          
          <div className="flex items-center mb-2">
            <div className="flex items-center text-sm">
              <span role="img" aria-label="trophy" className="mr-1 text-yellow-500">🏆</span>
              <span className="font-medium">Best Hour: {bestHour.lines > 0 ? `${bestHour.hour} (${bestHour.lines} lines picked)` : '(0 lines picked)'}</span>
            </div>
            <div className="ml-auto flex items-center text-sm">
              <span role="img" aria-label="target" className="mr-1 text-orange-400">🎯</span>
              <span className="font-medium">Avg Target: {averageTargetRate} lines/hour</span>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={heatmapData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 60, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  label={{ value: 'Completion %', position: 'bottom', offset: 0 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="hour" 
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [`${Math.round(item.lines)} of ${item.target} lines (${value}%)`, 'Completion'];
                  }}
                  labelFormatter={(value) => `Hour: ${value}`}
                />
                <Bar dataKey="value">
                  {heatmapData.map((entry, index) => {
                    let fill = '#EF4444'; // 0-20% (red)
                    if (entry.completionPercentage >= 80) fill = '#10B981'; // 80-100% (green)
                    else if (entry.completionPercentage >= 60) fill = '#84CC16'; // 60-80% (light green)
                    else if (entry.completionPercentage >= 40) fill = '#F59E0B'; // 40-60% (amber)
                    else if (entry.completionPercentage >= 20) fill = '#F97316'; // 20-40% (orange)
                    
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Color legend for heatmap */}
          <div className="mt-2 flex justify-center items-center space-x-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 mr-1"></div>
              <span>0-20%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 mr-1"></div>
              <span>20-40%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500 mr-1"></div>
              <span>40-60%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-lime-500 mr-1"></div>
              <span>60-80%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 mr-1"></div>
              <span>80-100%</span>
            </div>
          </div>
          
          {/* Explanation of the heatmap */}
          <div className="mt-2 text-sm text-gray-600">
            <p>This heatmap-style chart highlights the severity of underperformance using color intensity.
            Red indicates critical gaps, while green would indicate meeting targets.</p>
          </div>
        </div>

        {/* Cumulative Performance Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Cumulative Performance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis domain={[0, 'auto']} />
                <Tooltip 
                  formatter={(value: number) => Math.round(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#4F46E5" 
                  name="Total Lines"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={{ strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#9CA3AF" 
                  name="Target"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  isAnimationActive={false}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Area Under Curve Analysis */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <div className="flex items-center gap-1 mb-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h4 className="font-semibold">Performance Analysis</h4>
            </div>
            
            <div className="space-y-2">
              {/* Simple Average Rate */}
              <div className="bg-white rounded p-2 border border-blue-100">
                <p className="font-medium text-blue-800 mb-1">Simple Average Rate:</p>
                <div className="flex items-center">
                  <div className="text-xl font-bold">{areaUnderCurve.simpleAverage}</div>
                  <div className="ml-1 text-sm">lines/hour</div>
                  <div className="ml-4 text-xs text-gray-500">({areaUnderCurve.finalTotal} lines ÷ 8 hours)</div>
                </div>
              </div>
              
              {/* Gini Coefficient for Work Distribution */}
              <div className="bg-white rounded p-2 border border-blue-100">
                <p className="font-medium text-blue-800 mb-1">Labor Efficiency Ratio:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-baseline">
                      <div className="text-xl font-bold">{areaUnderCurve.efficiencyRatio}%</div>
                      <div className="ml-1 text-sm text-gray-500">(ideal = 100%)</div>
                    </div>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            areaUnderCurve.efficiencyRatio >= 90 ? 'bg-green-500' : 
                            areaUnderCurve.efficiencyRatio >= 70 ? 'bg-blue-500' : 
                            areaUnderCurve.efficiencyRatio >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, areaUnderCurve.efficiencyRatio)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs mt-1 text-gray-500">
                      Efficiency = {areaUnderCurve.area} (Blue AUC) ÷ {areaUnderCurve.targetArea} (Grey AUC) × 100
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{areaUnderCurve.interpretation}</p>
                  </div>
                </div>
              </div>
              
              {/* Peak and Slow Activity Periods */}
              <div className="flex flex-wrap gap-2">
                <div className="bg-white rounded p-2 border border-blue-100 flex-1">
                  <p className="font-medium">Peak Activity:</p>
                  <p className="text-gray-700">{areaUnderCurve.steepestHour} (+{areaUnderCurve.maxSlope} lines)</p>
                </div>
                <div className="bg-white rounded p-2 border border-blue-100 flex-1">
                  <p className="font-medium">Slowest Period:</p>
                  <p className="text-gray-700">{areaUnderCurve.flattestHour} (+{areaUnderCurve.minSlope} lines)</p>
                </div>
              </div>
            </div>
            
            <p className="mt-2 text-xs text-gray-600 italic">
              The Labor Efficiency Ratio measures how close your team&apos;s total work output (line-hours) is to the ideal target. A low ratio signals systemic inefficiencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPerformanceDisplay;