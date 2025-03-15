'use client';
import React from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';

interface DateRangeSelectorProps {
  onDateRangeChange?: (range: any) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ onDateRangeChange }) => {
  const { dateRange, setDateRange, availableRanges } = useTradingData();

  // Función para manejar el cambio de rango
  const handleRangeChange = (range: any) => {
    // Primero aplicamos el cambio en el contexto
    setDateRange(range);
    
    // Luego, si existe un callback, lo llamamos
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

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
          onClick={() => handleRangeChange(range)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangeSelector; 