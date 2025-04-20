export interface HourlyData {
  hour: number;
  lines: number;
  target: number;
  efficiency: number;
}

export interface Break {
  startTime: string;
  endTime: string;
  type: 'lunch' | 'short';
}

export interface Picker {
  id: string;
  name: string;
  target: number;
  performance: number;
  hourlyData: HourlyData[];
  status: 'active' | 'break' | 'offline';
  startTime: string;
  endTime: string;
  breaks: Break[];
}

export interface PerformanceRanking {
  rank: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface TopPerformer {
  pickerId: string;
  name: string;
  lines: number;
  efficiency: number;
}

export interface HourlyAnalysis {
  hour: number;
  totalLines: number;
  averageLines: number;
  topPerformer: TopPerformer;
}

export interface PerformanceMetrics {
  totalLines: number;
  averageLinesPerPicker: number;
  efficiencyScore: number;
  averageLinesPerHour: number;
  bestPerformer: TopPerformer;
  worstPerformer: TopPerformer;
  hourlyAnalysis: HourlyAnalysis[];
}

export interface ShiftProgress {
  percentageComplete: number;
  remainingTime: number; // in minutes
  isBreakTime: boolean;
  nextBreak?: {
    type: Break['type'];
    startsIn: number; // in minutes
  };
}

export type TabType = 'hourly' | 'individual' | 'team' | 'trends';

export interface DashboardState {
  pickers: Picker[];
  showRaceTrack: boolean;
  lastSyncTime: string;
  currentTab: TabType;
  performanceMetrics: PerformanceMetrics;
  shiftProgress: ShiftProgress;
  hourlyData: HourlyData[];
  hourlyPerformance: HourlyPerformance;
  targetLinesPerHour: number;
}

export interface HourlyPerformance {
  [pickerId: string]: {
    [hour: number]: number;
  };
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface AIReport {
  insights: string[];
  recommendations: string[];
  timestamp: string;
}

export interface EnergyMetrics {
  morningEnergy: number;
  lunchImpact: number;
  afternoonEnergy: number;
  lunchBreakCount: number;
}

export interface RaceTrackPosition {
  pickerId: string;
  position: number;
  progress: number;
} 