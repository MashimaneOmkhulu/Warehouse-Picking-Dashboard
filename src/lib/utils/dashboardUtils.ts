import { 
  Picker, 
  PerformanceMetrics, 
  ShiftProgress, 
  HourlyAnalysis,
  TopPerformer,
  Break
} from '../types/warehouse';

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
  const avgLines = pickers.length > 0 ? totalLines / pickers.length : 0;

  // Calculate average lines per hour
  let hoursWithData = 0;
  let totalHourlyLines = 0;
  
  // Count all hours with data across all pickers
  for (let hour = 9; hour <= 17; hour++) {
    let linesInHour = 0;
    let pickersWithDataInHour = 0;
    
    pickers.forEach(picker => {
      const hourData = picker.hourlyData.find(h => h.hour === hour);
      if (hourData && hourData.lines > 0) {
        linesInHour += hourData.lines;
        pickersWithDataInHour++;
      }
    });
    
    if (pickersWithDataInHour > 0) {
      hoursWithData++;
      totalHourlyLines += linesInHour;
    }
  }
  
  const avgLinesPerHour = hoursWithData > 0 ? totalHourlyLines / hoursWithData : 0;

  const sortedPickers = [...pickers].sort((a, b) => b.performance - a.performance);
  const bestPerformer = sortedPickers[0];
  const worstPerformer = sortedPickers[sortedPickers.length - 1];

  const hourlyAnalysis = calculateHourlyAnalysis(pickers);

  return {
    totalLines,
    averageLinesPerPicker: avgLines,
    averageLinesPerHour: avgLinesPerHour,
    efficiencyScore: totalTarget > 0 ? (totalLines / totalTarget) * 100 : 0,
    bestPerformer: bestPerformer ? {
      pickerId: bestPerformer.id,
      name: bestPerformer.name,
      lines: bestPerformer.performance,
      efficiency: (bestPerformer.performance / bestPerformer.target) * 100
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
      efficiency: (worstPerformer.performance / worstPerformer.target) * 100
    } : {
      pickerId: '',
      name: '',
      lines: 0,
      efficiency: 0
    },
    hourlyAnalysis
  };
}; 