import { Picker, HourlyPerformance, PerformanceMetrics, ShiftProgress, ChartData, TopPerformer, HourlyAnalysis, Break } from '../types/warehouse';

// Performance calculations
export const getTotalLines = (picker: Picker): number => {
  return picker.performance;
};

export const getTotalLinesAll = (pickers: Picker[]): number => {
  return pickers.reduce((sum, picker) => sum + picker.performance, 0);
};

export const getTotalTarget = (pickers: Picker[]): number => {
  return pickers.reduce((sum, picker) => sum + picker.target, 0);
};

export const calculateEfficiencyScore = (pickers: Picker[]): number => {
  const totalLines = getTotalLinesAll(pickers);
  const totalTarget = getTotalTarget(pickers);
  return totalTarget > 0 ? (totalLines / totalTarget) * 100 : 0;
};

export const getTopPerformers = (pickers: Picker[], count: number = 3): Picker[] => {
  return [...pickers]
    .sort((a, b) => b.performance - a.performance)
    .slice(0, count);
};

export const getWorstPerformer = (pickers: Picker[]): Picker => {
  return [...pickers].sort((a, b) => a.performance - b.performance)[0];
};

export const getBestHourlyPerformance = (hourlyData: HourlyPerformance, hour: number): number => {
  return Math.max(...Object.values(hourlyData).map(data => data[hour] || 0));
};

export const getAverageLinesPerPicker = (pickers: Picker[]): number => {
  return pickers.length > 0 ? getTotalLinesAll(pickers) / pickers.length : 0;
};

// Progress and status calculations
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#4A90E2';
  if (percentage >= 80) return '#FF9933';
  return '#D70000';
};

export const getStatusText = (percentage: number): string => {
  if (percentage >= 100) return 'On Target';
  if (percentage >= 80) return 'Slightly Behind';
  return 'Behind Schedule';
};

// Time-based calculations
export const getRemainingShiftTime = (): string => {
  const now = new Date();
  const endOfShift = new Date();
  endOfShift.setHours(17, 0, 0, 0); // Assuming shift ends at 5 PM
  
  const diff = endOfShift.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

export const getShiftProgressPercentage = (): number => {
  const now = new Date();
  const startOfShift = new Date();
  startOfShift.setHours(9, 0, 0, 0); // Assuming shift starts at 9 AM
  const endOfShift = new Date();
  endOfShift.setHours(17, 0, 0, 0); // Assuming shift ends at 5 PM
  
  const totalShiftTime = endOfShift.getTime() - startOfShift.getTime();
  const elapsedTime = now.getTime() - startOfShift.getTime();
  
  return (elapsedTime / totalShiftTime) * 100;
};

// Chart data preparation
export const prepareChartData = (pickers: Picker[], hourlyData: HourlyData[] | HourlyPerformance): ChartData[] => {
  return pickers.map(picker => ({
    name: picker.name,
    value: picker.performance,
    color: getProgressColor((picker.performance / picker.target) * 100)
  }));
};

// AI report generation
export const generateAIReport = (pickers: Picker[], hourlyData: HourlyPerformance): string[] => {
  const insights = [];
  const totalLines = getTotalLinesAll(pickers);
  const averageLines = getAverageLinesPerPicker(pickers);
  const efficiency = calculateEfficiencyScore(pickers);
  
  insights.push(`Total lines picked: ${totalLines}`);
  insights.push(`Average lines per picker: ${averageLines.toFixed(1)}`);
  insights.push(`Team efficiency: ${efficiency.toFixed(1)}%`);
  
  const bestPerformer = getTopPerformers(pickers, 1)[0];
  const worstPerformer = getWorstPerformer(pickers);
  
  insights.push(`Best performer: ${bestPerformer.name} (${bestPerformer.performance} lines)`);
  insights.push(`Worst performer: ${worstPerformer.name} (${worstPerformer.performance} lines)`);
  
  return insights;
};

// Star rating calculation
export const getStarRating = (performance: number, target: number): number => {
  const percentage = (performance / target) * 100;
  if (percentage >= 100) return 5;
  if (percentage >= 90) return 4;
  if (percentage >= 80) return 3;
  if (percentage >= 70) return 2;
  return 1;
};

export const calculateShiftProgress = (): ShiftProgress => {
  const now = new Date();
  const startTime = new Date();
  startTime.setHours(9, 0, 0, 0);
  const endTime = new Date();
  endTime.setHours(17, 0, 0, 0);

  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);

  // Check if it's break time (e.g., lunch break between 12-1)
  const currentHour = now.getHours();
  const isBreakTime = currentHour === 12;

  // Calculate next break
  let nextBreak: { type: Break['type']; startsIn: number } | undefined;
  if (currentHour < 12) {
    nextBreak = {
      type: 'lunch' as const,
      startsIn: (12 - currentHour) * 60 - now.getMinutes()
    };
  } else if (currentHour < 15) {
    nextBreak = {
      type: 'short' as const,
      startsIn: (15 - currentHour) * 60 - now.getMinutes()
    };
  }

  return {
    percentageComplete: Math.min((elapsedMinutes / totalMinutes) * 100, 100),
    remainingTime: Math.round(remainingMinutes),
    isBreakTime,
    nextBreak
  };
};

export const calculateHourlyAnalysis = (pickers: Picker[]): HourlyAnalysis[] => {
  const analysis: HourlyAnalysis[] = [];

  for (let hour = 9; hour <= 17; hour++) {
    const hourlyData = pickers.map(picker => 
      picker.hourlyData.find(data => data.hour === hour) || 
      { hour, lines: 0, target: 0, efficiency: 0 }
    );

    const totalLines = hourlyData.reduce((sum, data) => sum + data.lines, 0);
    const averageLines = pickers.length > 0 ? totalLines / pickers.length : 0;

    const topPerformer = [...pickers]
      .sort((a, b) => {
        const aLines = a.hourlyData.find(d => d.hour === hour)?.lines || 0;
        const bLines = b.hourlyData.find(d => d.hour === hour)?.lines || 0;
        return bLines - aLines;
      })[0];

    if (topPerformer) {
      analysis.push({
        hour,
        totalLines,
        averageLines,
        topPerformer: {
          pickerId: topPerformer.id,
          name: topPerformer.name,
          lines: topPerformer.hourlyData.find(d => d.hour === hour)?.lines || 0,
          efficiency: topPerformer.hourlyData.find(d => d.hour === hour)?.efficiency || 0
        }
      });
    }
  }

  return analysis;
};

export const calculatePerformanceMetrics = (pickers: Picker[]): PerformanceMetrics => {
  const totalLines = pickers.reduce((sum, p) => sum + p.performance, 0);
  const totalTarget = pickers.reduce((sum, p) => sum + p.target, 0);
  const averageLinesPerPicker = pickers.length > 0 ? totalLines / pickers.length : 0;

  // Calculate average lines per hour
  const currentHour = new Date().getHours();
  const startHour = 9; // 9 AM
  const elapsedHours = Math.max(1, currentHour - startHour);
  const averageLinesPerHour = totalLines / elapsedHours;

  // Calculate efficiency score (actual performance vs target)
  const efficiencyScore = totalTarget > 0 ? (totalLines / totalTarget) * 100 : 0;
  
  const sortedPickers = [...pickers].sort((a, b) => b.performance - a.performance);
  const bestPerformer = sortedPickers[0];
  const worstPerformer = sortedPickers[sortedPickers.length - 1];

  const hourlyAnalysis = calculateHourlyAnalysis(pickers);

  return {
    totalLines,
    averageLinesPerPicker,
    efficiencyScore,
    averageLinesPerHour,
    bestPerformer: bestPerformer ? {
      pickerId: bestPerformer.id,
      name: bestPerformer.name,
      lines: bestPerformer.performance,
      efficiency: bestPerformer.target > 0 ? bestPerformer.performance / bestPerformer.target : 0
    } : {
      pickerId: '',
      name: '',
      lines: 0,
      efficiency: 0
    },
    worstPerformer: worstPerformer ? {
      pickerId: worstPerformer.id,
      name: worstPerformer.name,
      lines: worstPerformer.performance,
      efficiency: worstPerformer.target > 0 ? worstPerformer.performance / worstPerformer.target : 0
    } : {
      pickerId: '',
      name: '',
      lines: 0,
      efficiency: 0
    },
    hourlyAnalysis
  };
};