'use client';
import React from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';

const DateRangeSelector: React.FC = () => {
  const { dateRange, setDateRange, availableRanges } = useTradingData();

  return (
    <div className="flex items-center space-x-1 bg-white border rounded-lg shadow-sm">
      {availableRanges.map((range) => (
        <button
          key={range.label}
          className={`px-3 py-2 text-sm ${
            dateRange.label === range.label
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setDateRange(range)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangeSelector; 