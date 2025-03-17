'use client';
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, addDays, subMonths, addMonths } from 'date-fns';

interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

interface ProgressTrackerSimpleProps {
  dailyResults?: { [date: string]: DailyResult };
}

const ProgressTrackerSimple: React.FC<ProgressTrackerSimpleProps> = ({ dailyResults = {} }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  

  
  // Generar el calendario
  const generateCalendar = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = [];
    
    let current = start;
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const dayData = dailyResults[dateStr];
      
      days.push({
        date: new Date(current),
        data: dayData
      });
      
      current = addDays(current, 1);
    }
    
    return days;
  };
  
  const calendar = generateCalendar();
  
  // Renderizar día
  const renderDay = (day: { date: Date; data: DailyResult }) => {
    const dateStr = format(day.date, 'yyyy-MM-dd');
    const hasData = !!day.data;
    
    let bgColor = 'bg-gray-100'; // Default
    if (hasData) {
      bgColor = day.data.status === 'win' ? 'bg-green-100' : 
                day.data.status === 'loss' ? 'bg-red-100' : 
                'bg-gray-100';
    }
    
    return (
      <div
        key={dateStr}
        className={`w-full h-12 rounded-md ${bgColor} flex flex-col items-center justify-center`}
      >
        <span className="text-xs text-gray-600">
          {format(day.date, 'd')}
        </span>
        {hasData && (
          <span className={`text-xs font-medium ${
            day.data.profit > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${Math.abs(day.data.profit).toFixed(2)}
          </span>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Progress Tracker</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <span className="text-sm">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendar.map(day => renderDay(day))}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100" />
          <span>Profitable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100" />
          <span>Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100" />
          <span>No trades</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackerSimple; 