'use client';

import { useState } from 'react';
import { Picker, DashboardState } from '@/lib/types/warehouse';
import { getProgressColor } from '@/lib/utils/warehouseUtils';

interface ManagementPanelProps {
  state: DashboardState;
  setState: React.Dispatch<React.SetStateAction<DashboardState>>;
}

const ManagementPanel = ({ state, setState }: ManagementPanelProps) => {
  const [newPicker, setNewPicker] = useState<Omit<Picker, 'id'>>({
    name: '',
    target: 0,
    performance: 0,
    hourlyData: [],
    status: 'offline',
    startTime: '',
    endTime: '',
    breaks: []
  });

  const [editingPicker, setEditingPicker] = useState<Picker | null>(null);
  const [linesInput, setLinesInput] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const handleAddPicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPicker.name || newPicker.target <= 0) return;

    const id = Date.now().toString();
    setState(prev => ({
      ...prev,
      pickers: [...prev.pickers, { ...newPicker, id }]
    }));
    setNewPicker({
      name: '',
      target: 0,
      performance: 0,
      hourlyData: [],
      status: 'offline',
      startTime: '',
      endTime: '',
      breaks: []
    });
  };

  const handleEditPicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPicker || !editingPicker.name || editingPicker.target <= 0) return;

    setState(prev => ({
      ...prev,
      pickers: prev.pickers.map(p => p.id === editingPicker.id ? editingPicker : p)
    }));
    setEditingPicker(null);
  };

  const handleDeletePicker = (id: string) => {
    setState(prev => ({
      ...prev,
      pickers: prev.pickers.filter(p => p.id !== id)
    }));
  };

  const handleRecordPerformance = () => {
    if (!editingPicker || !selectedHour || !linesInput) return;

    const lines = parseInt(linesInput);
    if (isNaN(lines) || lines < 0) return;

    setState(prev => {
      const updatedPickers = prev.pickers.map(p => {
        if (p.id === editingPicker.id) {
          const hourlyData = [...p.hourlyData];
          const existingHourIndex = hourlyData.findIndex(h => h.hour === selectedHour);
          
          if (existingHourIndex >= 0) {
            hourlyData[existingHourIndex] = {
              ...hourlyData[existingHourIndex],
              lines: lines,
              target: p.target,
              efficiency: (lines / p.target) * 100
            };
          } else {
            hourlyData.push({
              hour: selectedHour,
              lines: lines,
              target: p.target,
              efficiency: (lines / p.target) * 100
            });
          }

          return {
            ...p,
            performance: hourlyData.reduce((sum, h) => sum + h.lines, 0),
            hourlyData: hourlyData.sort((a, b) => a.hour - b.hour)
          };
        }
        return p;
      });

      return {
        ...prev,
        pickers: updatedPickers
      };
    });

    setLinesInput('');
    setSelectedHour(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-none">
      <div className="space-y-6">
        {/* Picker Management Section */}
        <div className="bg-blue-100 rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Picker Management</h2>
            <button
              onClick={() => setNewPicker({
                name: '',
                target: state.targetLinesPerHour || 100,
                performance: 0,
                hourlyData: [],
                status: 'active',
                startTime: '09:00',
                endTime: '17:00',
                breaks: []
              })}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <span className="mr-1">+</span> Add Picker
            </button>
          </div>

          {/* Add Picker Form */}
          {newPicker.name !== '' && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Add New Picker</h3>
              <form onSubmit={handleAddPicker} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Picker Name
                  </label>
                  <input
                    type="text"
                    value={newPicker.name}
                    onChange={(e) => setNewPicker({ ...newPicker, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter picker name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Lines Per Hour
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newPicker.target || ''}
                    onChange={(e) => setNewPicker({ ...newPicker, target: parseInt(e.target.value) || state.targetLinesPerHour || 100 })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Picker
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPicker({
                      name: '',
                      target: 0,
                      performance: 0,
                      hourlyData: [],
                      status: 'offline',
                      startTime: '',
                      endTime: '',
                      breaks: []
                    })}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pickers List */}
          <div className="space-y-0">
            {state.pickers.map(picker => (
              <div key={picker.id} className="bg-white p-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{picker.name}</h3>
                    <p className="text-sm text-gray-600">Target: {picker.target} lines</p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setEditingPicker(picker)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePicker(picker.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Picker Form */}
        {editingPicker && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
            <h3 className="text-lg font-semibold text-[#0A2D4D] mb-4">Edit Picker</h3>
            <form onSubmit={handleEditPicker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Picker Name
                </label>
                <input
                  type="text"
                  placeholder="Picker Name"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingPicker.name}
                  onChange={(e) => setEditingPicker(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Lines Per Hour
                </label>
                <input
                  type="number"
                  placeholder="Target Lines"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingPicker.target || ''}
                  onChange={(e) => setEditingPicker(prev => prev ? { ...prev, target: parseInt(e.target.value) || 0 } : null)}
                  min="1"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  disabled={!editingPicker.name || editingPicker.target <= 0}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                  onClick={() => setEditingPicker(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Record Performance Section */}
        <div>
          <h3 className="text-lg font-semibold text-[#0A2D4D] mb-4">Record Performance</h3>
          <div className="space-y-4">
            <select
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
              value={editingPicker?.id || ''}
              onChange={(e) => {
                const picker = state.pickers.find(p => p.id === e.target.value);
                setEditingPicker(picker || null);
              }}
            >
              <option value="">Select Picker</option>
              {state.pickers.map(picker => (
                <option key={picker.id} value={picker.id}>{picker.name}</option>
              ))}
            </select>

            <select
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
              value={selectedHour || ''}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
            >
              <option value="">Select Hour</option>
              {Array.from({ length: 8 }, (_, i) => i + 9).map(hour => (
                <option key={hour} value={hour}>{hour}:00</option>
              ))}
            </select>

            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Lines picked"
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                value={linesInput}
                onChange={(e) => setLinesInput(e.target.value)}
                min="0"
              />
              <button
                className="bg-[#4A90E2] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                onClick={handleRecordPerformance}
                disabled={!editingPicker || !selectedHour || !linesInput}
              >
                Record
              </button>
            </div>

            {editingPicker && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="breakStatus"
                  className="rounded text-[#4A90E2] focus:ring-[#4A90E2]"
                  checked={editingPicker.status === 'break'}
                  onChange={(e) => {
                    setEditingPicker(prev => prev ? {
                      ...prev,
                      status: e.target.checked ? 'break' : 'active'
                    } : null);
                    
                    setState(prev => ({
                      ...prev,
                      pickers: prev.pickers.map(p => 
                        p.id === editingPicker.id 
                          ? { ...p, status: e.target.checked ? 'break' : 'active' }
                          : p
                      )
                    }));
                  }}
                />
                <label htmlFor="breakStatus" className="text-[#0A2D4D]">On Break</label>
              </div>
            )}
          </div>
        </div>

        {/* Picker List - Horizontal Table Layout */}
        <div>
          <h3 className="text-lg font-semibold text-[#0A2D4D] mb-4">Picker List</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 font-medium text-gray-700">Name</th>
                  <th className="p-3 font-medium text-gray-700">Status</th>
                  <th className="p-3 font-medium text-gray-700">Performance</th>
                  <th className="p-3 font-medium text-gray-700">Target</th>
                  <th className="p-3 font-medium text-gray-700">Completion</th>
                  <th className="p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.pickers.map(picker => {
                  const percentage = (picker.performance / picker.target) * 100;
                  const color = getProgressColor(percentage);
                  
                  return (
                    <tr key={picker.id} className="border-b border-gray-200 hover:bg-gray-50">
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
                      <td className="p-3 w-48">
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
                        <div className="mt-2 text-xs text-gray-600">
                          {[9, 11, 13, 15, 17].map(hour => {
                            const hourData = picker.hourlyData.find(h => h.hour === hour);
                            return (
                              <span key={hour} className="mr-2">
                                {hour}h: {hourData?.lines || 0}
                              </span>
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
                            onClick={() => handleDeletePicker(picker.id)}
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
};

export default ManagementPanel; 