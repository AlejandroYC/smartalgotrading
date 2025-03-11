'use client';
import React, { useState } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangePickerProps {
  onChange: (startDate: Date, endDate: Date) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const [selectedRange, setSelectedRange] = useState('30d');
  
  const handleRangeChange = (range: string) => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'ytd':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(2000, 0, 1); // Fecha muy antigua para abarcar todo
        break;
    }
    
    setSelectedRange(range);
    onChange(startDate, endDate);
  };
  
  return (
    <div className="flex items-center space-x-1 bg-white border rounded-lg shadow-sm">
      {['7d', '30d', '90d', 'ytd', '1y', 'all'].map((range) => (
        <button
          key={range}
          className={`px-3 py-2 text-sm ${
            selectedRange === range
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => handleRangeChange(range)}
        >
          {range === 'ytd' ? 'YTD' : 
           range === 'all' ? 'Todo' : 
           range}
        </button>
      ))}
    </div>
  );
};

export default DateRangePicker; 