import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, addDays, subMonths, addMonths } from 'date-fns';
import { DailyResult } from '@/services/TradingDataService';

// Versión protegida contra errores
const ProgressTracker = ({ accountData, dailyResults: propDailyResults, onDayClick }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [processedResults, setProcessedResults] = useState({});
  

  // Si no hay datos, mostrar mensaje
  const hasData = !!(
    (accountData?.statistics?.daily_results && Object.keys(accountData.statistics.daily_results).length > 0) ||
    (propDailyResults && Object.keys(propDailyResults).length > 0)
  );
  
  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Progress Tracker</h2>
        <div className="py-8 text-center text-gray-500">
          <p>Procesando datos de trading...</p>
          <p className="text-sm mt-2">El calendario mostrará tus resultados diarios cuando estén disponibles.</p>
        </div>
      </div>
    );
  }
  
  // Procesar los datos al cargar el componente
  useEffect(() => {
    const dailyData = accountData?.statistics?.daily_results || propDailyResults || {};
    
    const months = new Set<string>();
    Object.keys(dailyData).forEach(dateStr => {
      const month = dateStr.substring(0, 7);
      months.add(month);
    });
    
    const sortedMonths = Array.from(months).sort();
    setAvailableMonths(sortedMonths);
    
    if (sortedMonths.length > 0) {
      const currentMonthStr = format(selectedMonth, 'yyyy-MM');
      if (!sortedMonths.includes(currentMonthStr)) {
        const latestMonth = sortedMonths[sortedMonths.length - 1];
        const [year, month] = latestMonth.split('-').map(Number);
        setSelectedMonth(new Date(year, month - 1, 1));
      }
    }
  }, [accountData, propDailyResults, selectedMonth]);
  
  // Procesar los datos cuando cambien
  useEffect(() => {
   
    
    // Objeto para almacenar resultados
    const results = {};
    
    try {
      // Intentar obtener daily_results de accountData
      if (accountData?.statistics?.daily_results) {
        Object.assign(results, accountData.statistics.daily_results);
      } 
      // Si no, intentar usar propDailyResults
      else if (propDailyResults) {
        Object.assign(results, propDailyResults);
      }
      
    } catch (error) {
      console.error("Error procesando resultados:", error);
    }
    
    setProcessedResults(results);
  }, [accountData, propDailyResults]);
  
  // Dentro del useEffect que procesa los datos
  useEffect(() => {
   
  }, [accountData, propDailyResults, selectedMonth]);
  
  // Generar el calendario
  const generateCalendar = useCallback(() => {
    const results = processedResults;
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days: Array<{ date: Date; data?: DailyResult }> = [];

    const resultsByDate = results.reduce((acc, day) => {
      try {
        const dateStr = format(day.date, 'yyyy-MM-dd');
        acc[dateStr] = {
          profit: day.profit,
          trades: day.trades,
          status: day.status
        };
      } catch (err) {
        console.warn("Error processing day:", err);
      }
      return acc;
    }, {} as DailyResults);

    let current = start;
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const dayData = resultsByDate[dateStr];
      
      days.push({
        date: new Date(current),
        data: dayData
      });

      current = addDays(current, 1);
    }

    return days;
  }, [selectedMonth, processedResults]);
  
  const calendar = generateCalendar();
  
  const renderDay = (day: { date: Date; data?: DailyResult }) => {
    const dateStr = format(day.date, 'yyyy-MM-dd');
    const hasData = !!day.data;
    
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-600';
    let profitText = '';
    
    if (hasData) {
      if (day.data?.status === 'win') {
        bgColor = 'bg-green-100';
        textColor = 'text-green-600';
      } else if (day.data?.status === 'loss') {
        bgColor = 'bg-red-100';
        textColor = 'text-red-600';
      }
      
      profitText = `$${Math.abs(day.data?.profit || 0).toFixed(2)}`;
    }

    return (
      <button
        key={dateStr}
        onClick={() => hasData && onDayClick?.(dateStr)}
        className={`
          w-full h-12 rounded-md 
          ${bgColor}
          ${hasData ? 'hover:opacity-75 cursor-pointer' : 'cursor-default'}
          transition-all duration-200
        `}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-xs text-gray-600">
            {format(day.date, 'd')}
          </span>
          {hasData && (
            <span className={`text-xs font-medium ${textColor}`}>
              {profitText}
            </span>
          )}
        </div>
      </button>
    );
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Progress Tracker</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          
          {/* Selector de mes como dropdown si hay muchos meses */}
          {availableMonths.length > 0 ? (
            <select 
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                setSelectedMonth(new Date(year, month - 1, 1));
              }}
              className="text-sm px-2 py-1 border rounded"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {format(new Date(month.split('-')[0], Number(month.split('-')[1]) - 1, 1), 'MMMM yyyy')}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
          )}
          
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
        {calendar.map(renderDay)}
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

      {/* Añadir información de debug */}
      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>
          {Object.keys(accountData?.statistics?.daily_results || propDailyResults || {}).length} días con trades
        </span>
        {availableMonths.length > 0 && (
          <span>
            {availableMonths.length} meses disponibles
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker; 