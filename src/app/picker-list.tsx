'use client';

import { useState, useEffect } from 'react';
import { DashboardState, Picker } from '@/lib/types/warehouse';
import { getProgressColor } from '@/lib/utils/warehouseUtils';
import Link from 'next/link';

// Mock data for initial state
const initialPickers = [
  {
    id: '1',
    name: 'John Smith',
    performance: 50,
    target: 100,
    status: 'active' as const,
    hourlyData: Array.from({ length: 9 }, (_, i) => ({
      hour: i + 9,
      lines: i === 10 ? 15 : i === 11 ? 20 : 5,
      target: 100,
      efficiency: 0
    })),
    startTime: '09:00',
    endTime: '17:00',
    breaks: []
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    performance: 70,
    target: 120,
    status: 'active' as const,
    hourlyData: Array.from({ length: 9 }, (_, i) => ({
      hour: i + 9,
      lines: i === 10 ? 22 : i === 11 ? 18 : 10,
      target: 120,
      efficiency: 0
    })),
    startTime: '09:00',
    endTime: '17:00',
    breaks: []
  },
  {
    id: '3',
    name: 'Mike Wilson',
    performance: 30,
    target: 110,
    status: 'break' as const,
    hourlyData: Array.from({ length: 9 }, (_, i) => ({
      hour: i + 9,
      lines: i === 10 ? 10 : i === 11 ? 12 : 4,
      target: 110,
      efficiency: 0
    })),
    startTime: '09:00',
    endTime: '17:00',
    breaks: []
  }
];

export default function PickerListPage() {
  const [pickers, setPickers] = useState<Picker[]>(initialPickers);
  const [editingPicker, setEditingPicker] = useState<Picker | null>(null);

  const handleDelete = (id: string) => {
    setPickers(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-full mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Horizontal Picker List Example
            </h1>
            <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-lg p-6 w-full border-2 border-blue-200">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Horizontal Picker List</h2>
          
          <div className="overflow-x-auto bg-white rounded-lg">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-blue-100 text-left border-b-2 border-blue-200">
                  <th className="p-3 font-semibold text-blue-800">Picker Name</th>
                  <th className="p-3 font-semibold text-blue-800">Status</th>
                  <th className="p-3 font-semibold text-blue-800">Performance</th>
                  <th className="p-3 font-semibold text-blue-800">Target</th>
                  <th className="p-3 font-semibold text-blue-800 w-48">Progress</th>
                  <th className="p-3 font-semibold text-blue-800">Hourly Breakdown</th>
                  <th className="p-3 font-semibold text-blue-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pickers.map(picker => {
                  const percentage = (picker.performance / picker.target) * 100;
                  const color = getProgressColor(percentage);
                  
                  return (
                    <tr key={picker.id} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="p-3 font-medium text-gray-800">{picker.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          picker.status === 'active' ? 'bg-green-100 text-green-800' :
                          picker.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {picker.status.charAt(0).toUpperCase() + picker.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-blue-700">{picker.performance}</td>
                      <td className="p-3 text-gray-700">{picker.target}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${percentage >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2 text-xs">
                          {[9, 11, 13, 15, 17].map(hour => {
                            const hourData = picker.hourlyData.find(h => h.hour === hour);
                            return (
                              <div key={hour} className="px-2 py-1 bg-gray-100 rounded">
                                {hour}h: <span className="font-medium text-blue-700">{hourData?.lines || 0}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm rounded hover:bg-blue-50"
                            onClick={() => setEditingPicker(picker)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 px-2 py-1 text-sm rounded hover:bg-red-50"
                            onClick={() => handleDelete(picker.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 