'use client';
import React, { useState, useEffect } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTradingData } from '@/contexts/TradingDataContext';

interface DateRangePickerProps {
  onChange?: (startDate: Date, endDate: Date) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const { dateRange, setDateRange, availableRanges } = useTradingData();
  const [selectedRange, setSelectedRange] = useState(dateRange?.label || '30d');
  
  // Sincronizar con el context cuando cambia
  useEffect(() => {
    if (dateRange) {
      // Buscar el rango que corresponde con el dateRange del context
      const matchingRange = availableRanges.find(r => r.label === dateRange.label);
      if (matchingRange) {
        setSelectedRange(matchingRange.label);
      }
    }
  }, [dateRange, availableRanges]);
  
  const handleRangeChange = (range: string) => {
    // Buscar el rango seleccionado en los disponibles
    const selectedRangeObj = availableRanges.find(r => r.label === range);
    
    if (selectedRangeObj) {
      setSelectedRange(range);
      
      // Actualizar el contexto (esto ya no hará solicitudes al backend)
      setDateRange(selectedRangeObj);
      
      // Si hay un callback adicional, llamarlo
      if (onChange) {
        onChange(selectedRangeObj.startDate, selectedRangeObj.endDate);
      }
    }
  };
  
  return (
    <div className="flex items-center space-x-1 bg-white border rounded-lg shadow-sm">
      {availableRanges.map((range) => (
        <button
          key={range.label}
          className={`px-3 py-2 text-sm ${
            selectedRange === range.label
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => handleRangeChange(range.label)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangePicker; 