'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Picker, HourlyData } from '@/lib/types/warehouse';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface PerformancePageProps {
  params: {
    id: string;
  };
}

const PickerPerformancePage = ({ params }: PerformancePageProps) => {
  const router = useRouter();
  const [picker, setPicker] = useState<Picker | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'analysis'>('overview');

  // In a real app, this would fetch from an API
  useEffect(() => {
    // Mock data for demonstration
    const mockPicker: Picker = {
      id: params.id,
      name: params.id === '1' ? 'John Smith' : params.id === '2' ? 'Sarah Johnson' : 'Mike Wilson',
      target: params.id === '1' ? 100 : params.id === '2' ? 120 : 110,
      performance: 0,
      hourlyData: Array.from({ length: 8 }, (_, i) => ({
        hour: i + 9,
        lines: Math.floor(Math.random() * 20),
        target: 15,
        efficiency: 0
      })),
      status: 'active',
      startTime: '09:00',
      endTime: '17:00',
      breaks: []
    };

    // Calculate efficiency for each hour
    mockPicker.hourlyData = mockPicker.hourlyData.map(data => ({
      ...data,
      efficiency: (data.lines / data.target) * 100
    }));

    // Calculate total performance
    mockPicker.performance = mockPicker.hourlyData.reduce((sum, data) => sum + data.lines, 0);

    setPicker(mockPicker);
  }, [params.id]);

  if (!picker) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  const weeklyTrendData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    performance: Math.floor(70 + Math.random() * 30),
    target: 100
  }));

  const efficiencyData = picker.hourlyData.map(data => ({
    hour: `${data.hour}:00`,
    efficiency: data.efficiency,
    target: 100
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Picker Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{picker.name}</h1>
              <p className="text-gray-500">Picker ID: {picker.id}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{picker.performance}</div>
              <div className="text-sm text-gray-500">of {picker.target} lines target</div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="text-sm text-indigo-600 font-medium">Current Hour</div>
              <div className="mt-1 flex justify-between items-end">
                <div className="text-2xl font-bold text-indigo-900">
                  {picker.hourlyData[picker.hourlyData.length - 1]?.lines || 0}
                </div>
                <div className="text-xs text-indigo-500">lines/hour</div>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="text-sm text-emerald-600 font-medium">Completion</div>
              <div className="mt-1 flex justify-between items-end">
                <div className="text-2xl font-bold text-emerald-900">
                  {Math.round((picker.performance / picker.target) * 100)}%
                </div>
                <div className="text-xs text-emerald-500">of target</div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-sm text-amber-600 font-medium">Time Left</div>
              <div className="mt-1 flex justify-between items-end">
                <div className="text-2xl font-bold text-amber-900">
                  {17 - new Date().getHours()}h {60 - new Date().getMinutes()}m
                </div>
                <div className="text-xs text-amber-500">remaining</div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600 font-medium">Required Rate</div>
              <div className="mt-1 flex justify-between items-end">
                <div className="text-2xl font-bold text-blue-900">
                  {Math.ceil((picker.target - picker.performance) / Math.max(1, 17 - new Date().getHours()))}
                </div>
                <div className="text-xs text-blue-500">lines/hour</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round((picker.performance / picker.target) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (picker.performance / picker.target) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['overview', 'trends', 'analysis'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-8 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Today's Performance */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Performance</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={picker.hourlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="lines" fill="#6366f1" name="Lines Picked" />
                          <Bar dataKey="target" fill="#e0e7ff" name="Target" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Efficiency Chart */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Efficiency</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={efficiencyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={2} />
                          <Line type="monotone" dataKey="target" stroke="#e0e7ff" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="performance" stroke="#6366f1" fill="#e0e7ff" />
                        <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
                    <h4 className="text-sm font-medium opacity-75">Average Lines/Hour</h4>
                    <div className="text-2xl font-bold mt-2">
                      {(picker.performance / picker.hourlyData.length).toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <h4 className="text-sm font-medium opacity-75">Peak Performance</h4>
                    <div className="text-2xl font-bold mt-2">
                      {Math.max(...picker.hourlyData.map(d => d.lines))} lines
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <h4 className="text-sm font-medium opacity-75">Average Efficiency</h4>
                    <div className="text-2xl font-bold mt-2">
                      {(picker.hourlyData.reduce((sum, d) => sum + d.efficiency, 0) / picker.hourlyData.length).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickerPerformancePage; 