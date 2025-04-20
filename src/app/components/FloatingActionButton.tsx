'use client';

import { useState } from 'react';

interface FloatingActionButtonProps {
  onAddPerformance: (lines: number) => void;
}

const FloatingActionButton = ({ onAddPerformance }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numLines = parseInt(lines);
    if (!isNaN(numLines) && numLines > 0) {
      onAddPerformance(numLines);
      setLines('');
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-64 transform transition-all duration-200 ease-out">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="lines" className="block text-sm font-medium text-gray-700">
                Lines Picked
              </label>
              <input
                type="number"
                id="lines"
                value={lines}
                onChange={(e) => setLines(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter number of lines"
                min="1"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-lg text-white transition-all duration-200 transform hover:scale-110 ${
          isOpen ? 'bg-red-500 rotate-45' : 'bg-indigo-600'
        }`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionButton; 