'use client';
import React, { useState, useRef } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface DateRangeSelectorProps {
  onDateRangeChange?: (range: any) => void;
  className?: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ onDateRangeChange, className }) => {
  const { dateRange, setDateRange } = useTradingData();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  // Función para formatear la fecha en formato legible
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Función para obtener el nombre del mes
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Función para manejar el cambio de rango
  const handleRangeChange = (range: any) => {
    setDateRange(range);
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  // Quick selection options
  const quickSelections = [
    { label: 'Today', key: 'today' },
    { label: 'This week', key: 'this-week' },
    { label: 'This month', key: 'this-month' },
    { label: 'Last 30 days', key: 'last-30-days' },
    { label: 'Last month', key: 'last-month' },
    { label: 'This quarter', key: 'this-quarter' },
    { label: 'YTD (year to date)', key: 'ytd' }
  ];

  // Función para generar el calendario
  const generateCalendar = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Agregar días del mes anterior
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Agregar días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas x 7 días
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  // Función para navegar entre meses
  const navigateMonth = (date: Date, direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    if (direction === 'prev') {
      newDate.setMonth(date.getMonth() - 1);
    } else {
      newDate.setMonth(date.getMonth() + 1);
    }
    return newDate;
  };

  // Función para verificar si una fecha está seleccionada
  const isSelected = (date: Date) => {
    return date.toDateString() === dateRange.startDate.toDateString() ||
           date.toDateString() === dateRange.endDate.toDateString();
  };

  // Función para verificar si una fecha está en el rango
  const isInRange = (date: Date) => {
    return date >= dateRange.startDate && date <= dateRange.endDate;
  };

  const MonthYearSelector = ({ date, onChange }: { date: Date, onChange: (date: Date) => void }) => {
  return (
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => onChange(navigateMonth(date, 'prev'))}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex space-x-1">
          <select
            value={date.getMonth()}
            onChange={(e) => {
              const newDate = new Date(date);
              newDate.setMonth(parseInt(e.target.value));
              onChange(newDate);
            }}
            className="text-sm border-0 cursor-pointer focus:ring-0 text-gray-900 py-0 pl-1 pr-6 appearance-none bg-transparent"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={date.getFullYear()}
            onChange={(e) => {
              const newDate = new Date(date);
              newDate.setFullYear(parseInt(e.target.value));
              onChange(newDate);
            }}
            className="text-sm border-0 cursor-pointer focus:ring-0 text-gray-900 py-0 pl-1 pr-6 appearance-none bg-transparent"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - 5 + i}>
                {new Date().getFullYear() - 5 + i}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onChange(navigateMonth(date, 'next'))}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center h-9 space-x-2 px-8 py-8 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-gray-700">
          {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 flex">
          <div className="flex p-6 border-r border-gray-200">
            {/* Calendario izquierdo */}
            <div className="mr-8">
              <MonthYearSelector
                date={dateRange.startDate}
                onChange={(date) => handleRangeChange({ ...dateRange, startDate: date })}
              />
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-xs font-medium text-gray-500 text-center h-7 flex items-center justify-center">
                    {day}
                  </div>
                ))}
                {generateCalendar(dateRange.startDate).map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleRangeChange({
                      ...dateRange,
                      startDate: day.date
                    })}
                    className={`
                      relative h-7 w-7 flex items-center justify-center text-sm rounded-full
                      ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${isSelected(day.date)
                        ? 'bg-blue-600 text-white'
                        : isInRange(day.date)
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendario derecho */}
            <div>
              <MonthYearSelector
                date={dateRange.endDate}
                onChange={(date) => handleRangeChange({ ...dateRange, endDate: date })}
              />
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-xs font-medium text-gray-500 text-center h-7 flex items-center justify-center">
                    {day}
                  </div>
                ))}
                {generateCalendar(dateRange.endDate).map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleRangeChange({
                      ...dateRange,
                      endDate: day.date
                    })}
                    className={`
                      relative h-7 w-7 flex items-center justify-center text-sm rounded-full
                      ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${isSelected(day.date)
                        ? 'bg-blue-600 text-white'
                        : isInRange(day.date)
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick selections */}
          <div className="w-40 py-2">
            {quickSelections.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  const today = new Date();
                  let range;
                  
                  switch (option.key) {
                    case 'today':
                      range = { startDate: today, endDate: today };
                      break;
                    case 'this-week':
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay());
                      range = { startDate: startOfWeek, endDate: today };
                      break;
                    case 'this-month':
                      range = {
                        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
                        endDate: today
                      };
                      break;
                    case 'last-30-days':
                      const thirtyDaysAgo = new Date(today);
                      thirtyDaysAgo.setDate(today.getDate() - 30);
                      range = { startDate: thirtyDaysAgo, endDate: today };
                      break;
                    case 'last-month':
                      range = {
                        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                        endDate: new Date(today.getFullYear(), today.getMonth(), 0)
                      };
                      break;
                    case 'this-quarter':
                      const quarter = Math.floor(today.getMonth() / 3);
                      range = {
                        startDate: new Date(today.getFullYear(), quarter * 3, 1),
                        endDate: today
                      };
                      break;
                    case 'ytd':
                      range = {
                        startDate: new Date(today.getFullYear(), 0, 1),
                        endDate: today
                      };
                      break;
                    default:
                      range = { startDate: today, endDate: today };
                  }
                  
                  handleRangeChange({ ...range, label: option.label });
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                {option.label}
        </button>
      ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector; 