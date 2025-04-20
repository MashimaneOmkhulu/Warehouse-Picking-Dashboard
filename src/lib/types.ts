import { Timestamp } from "firebase/firestore";

export interface Picker {
  id: string;
  name: string;
  target: number;
  active: boolean;
  linesCompleted: number;
  hourlyData: {
    [hour: string]: number;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PickerData extends Omit<Picker, 'id'> {
  id?: string;
}

export interface PerformanceMetrics {
  totalPickers: number;
  activePickers: number;
  totalLinesCompleted: number;
  targetLines: number;
  completionPercentage: number;
  topPerformers: Picker[];
  underperformers: Picker[];
}

export interface UserRole {
  role: 'admin' | 'manager' | 'viewer';
  email: string;
  username: string;
}

export type HourKey = '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17'; 