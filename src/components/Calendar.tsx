import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Settings, Info } from "lucide-react";
import { useTradingData } from '@/contexts/TradingDataContext';

interface DayStats {
  profit: number;
  trades: number;
  winRate: number;
}

interface WeekStats {
  profit: number;
  tradingDays: number;
}

interface CalendarProps {
  onDayClick?: (date: string, stats: any) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { processedData } = useTradingData();
  
  // Obtener los datos del mes actual
  const { dailyStats, weeklyStats, monthlyStats } = useMemo(() => {
    const dailyStats: Record<string, DayStats> = {};
    const weeklyStats: Record<number, WeekStats> = {};
    let monthlyStats = {
      totalProfit: 0,
      tradingDays: 0
    };

    // Salir temprano si no hay datos
    if (!processedData?.daily_results) {
      return { dailyStats, weeklyStats, monthlyStats };
    }

    // Filtrar solo los días del mes actual
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth() + 1;
    
    // Formato del mes para comparación (con ceros a la izquierda)
    const monthStr = currentMonthNum < 10 ? `0${currentMonthNum}` : `${currentMonthNum}`;
    const yearMonthPrefix = `${currentYear}-${monthStr}`;

    Object.entries(processedData.daily_results).forEach(([dateStr, dayData]: [string, any]) => {
      if (!dayData || !dateStr.startsWith(yearMonthPrefix)) return;
      
      // Parsear la fecha para obtener el día del mes
      const date = new Date(dateStr);
      const day = date.getDate();
      
      // Calcular la semana (1-5 basado en el día del mes)
      const week = Math.ceil(day / 7);
      
      // Crear o actualizar estadísticas diarias
      const profit = typeof dayData.profit === 'string' ? parseFloat(dayData.profit) : dayData.profit;
      
      dailyStats[day] = {
        profit: profit,
        trades: dayData.trades || 0,
        winRate: dayData.status === 'win' ? 100 : dayData.status === 'loss' ? 0 : 50
      };
      
      // Actualizar estadísticas semanales
      if (!weeklyStats[week]) {
        weeklyStats[week] = {
          profit: 0,
          tradingDays: 0
        };
      }
      
      weeklyStats[week].profit += profit;
      weeklyStats[week].tradingDays += 1;
      
      // Actualizar estadísticas mensuales
      monthlyStats.totalProfit += profit;
      monthlyStats.tradingDays += 1;
    });
    
    return { dailyStats, weeklyStats, monthlyStats };
  }, [currentMonth, processedData?.daily_results]);

  // Función para manejar el cambio de mes
  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Funciones para obtener los días de la semana y la información de la fecha
  const getDaysOfWeek = () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getTotalDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  // Variables de cálculo de días
  const firstDay = getFirstDayOfMonth(currentMonth);
  const totalDays = getTotalDaysInMonth(currentMonth);

  // Preparar la visualización del mes actual
  const currentMonthName = currentMonth.toLocaleString('default', { month: 'long' });
  const currentYear = currentMonth.getFullYear();

  // Crear la estructura del calendario
  const renderCalendarGrid = () => {
    const days = [];
    let dayCount = 1;
    
    // Máximo 6 filas en un calendario mensual
    for (let week = 0; week < 6; week++) {
      if (dayCount > totalDays) break;
      
      const weekRow = [];
      
      // 7 días por semana
      for (let weekday = 0; weekday < 7; weekday++) {
        // Para la primera semana, rellenar con espacios vacíos hasta el primer día
        if (week === 0 && weekday < firstDay) {
          weekRow.push(
            <div key={`empty-${weekday}`} className="bg-gray-50 p-2 min-h-[100px]"></div>
          );
        } 
        // Para los días válidos del mes
        else if (dayCount <= totalDays) {
          const dayStats = dailyStats[dayCount];
          const hasData = !!dayStats;
          const isProfit = hasData && dayStats.profit >= 0;
          const bgColor = hasData 
            ? isProfit 
              ? 'bg-green-50' 
              : 'bg-red-50'
            : 'bg-gray-50';
          
          const profitColor = hasData
            ? isProfit
              ? 'text-green-600'
              : 'text-red-600'
            : 'text-gray-400';
            
          weekRow.push(
            <div 
              key={dayCount} 
              className={`${bgColor} p-2 min-h-[100px] border border-gray-100 relative`}
              onClick={() => {
                if (hasData && onDayClick) {
                  // Formato YYYY-MM-DD
                  const monthStr = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
                  const dayStr = dayCount.toString().padStart(2, '0');
                  const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
                  onDayClick(dateStr, dayStats);
                }
              }}
            >
              <div className="absolute top-1 right-2 text-sm text-gray-500">
                {dayCount}
              </div>
              
              {hasData && (
                <div className="mt-5 flex flex-col items-center">
                  <div className={`text-xl font-bold ${profitColor}`}>
                    ${Math.abs(dayStats.profit).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {dayStats.trades} {dayStats.trades === 1 ? 'trade' : 'trades'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {dayStats.trades > 0 ? (dayStats.winRate || 0).toFixed(1) + '%' : '0.0%'}
                  </div>
                </div>
              )}
            </div>
          );
          
          dayCount++;
        } 
        // Rellenar con espacios vacíos después del último día
        else {
          weekRow.push(
            <div key={`empty-end-${weekday}`} className="bg-gray-50 p-2 min-h-[100px]"></div>
          );
        }
      }
      
      // Contenido de resumen semanal a la derecha
      const weekSummary = weeklyStats[week + 1];
      const hasWeekData = !!weekSummary && weekSummary.tradingDays > 0;
      const isWeekProfit = hasWeekData && weekSummary.profit >= 0;
      const weekProfitColor = hasWeekData
        ? isWeekProfit
          ? 'text-green-600'
          : 'text-red-600'
        : 'text-gray-400';
      
      // Añadir la fila de la semana al calendario
      days.push(
        <div key={`week-${week}`} className="grid grid-cols-8 gap-1">
          {weekRow}
          
          {/* Resumen semanal */}
          <div className="bg-white p-2 border border-gray-100 rounded-lg flex flex-col justify-center items-center">
            <div className="text-sm font-medium text-gray-700">Week {week + 1}</div>
            {hasWeekData ? (
              <>
                <div className={`text-lg font-bold ${weekProfitColor}`}>
                  ${weekSummary.profit.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  {weekSummary.tradingDays} {weekSummary.tradingDays === 1 ? 'day' : 'days'}
                </div>
              </>
            ) : (
              <div className="text-lg font-bold text-gray-400">$0</div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePrevMonth}
            className="p-1 rounded-md hover:bg-gray-100"
          >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
          
        <h3 className="text-lg font-semibold">
            {currentMonthName} {currentYear}
        </h3>
          
          <button 
            onClick={handleNextMonth}
            className="p-1 rounded-md hover:bg-gray-100"
          >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
          
          <button 
            onClick={goToCurrentMonth}
            className="ml-2 px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            This month
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            Monthly stats: 
            <span className={monthlyStats.totalProfit >= 0 ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>
              ${monthlyStats.totalProfit.toFixed(1)}
            </span>
            <span className="ml-2 text-gray-500">
              {monthlyStats.tradingDays} days
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <Info className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-8 gap-1 mb-1">
        {getDaysOfWeek().map((day) => (
          <div key={day} className="p-2 text-center bg-white text-gray-700 font-medium">
            {day}
          </div>
        ))}
        {/* Columna para resumen semanal */}
        <div className="p-2 text-center bg-white text-gray-700 font-medium">
          Sat
        </div>
      </div>

      {/* Rejilla del calendario */}
      <div className="space-y-1">
        {renderCalendarGrid()}
      </div>
    </div>
  );
};

export default Calendar;
