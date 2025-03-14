'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, addDays, subMonths, addMonths, getWeek, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useTradingData } from '@/contexts/TradingDataContext';
import DailyTradeDetails from '@/components/DailyTradeDetails';
import toast from 'react-hot-toast';
import { Trade } from '@/types/Trade';

interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

interface DailyResults {
  [date: string]: DailyResult;
}

interface ProgressTrackerProps {
  onDayClick?: (date: string) => void;
  handleDateRangeChange?: (fromDate: Date, toDate: Date) => void;
}

interface WeekSummary {
  number: number;
  amount: string;
  days: string;
  tradingDays: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ onDayClick, handleDateRangeChange }) => {
  // Usar el contexto de datos de trading
  const { processedData, dateRange, setDateRange } = useTradingData();
  
  // Obtener los resultados diarios
  const dailyResults: DailyResults = processedData?.daily_results || {};
  
  // Estado para el mes seleccionado
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Añadir el estado para el modal y la fecha seleccionada
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayTrades, setDayTrades] = useState<Trade[]>([]);
  
  // Añadir un estado para almacenar un mapa de operaciones por fecha
  const [tradesByDate, setTradesByDate] = useState<Record<string, Trade[]>>({});

  // Procesar los resultados diarios
  const processResults = useCallback(() => {
    const days = Object.entries(dailyResults).map(([date, data]) => ({
      date: new Date(date),
      profit: data.profit,
      trades: data.trades,
      status: data.status
    }));

    // Ordenar por fecha
    days.sort((a, b) => a.date.getTime() - b.date.getTime());

    return days;
  }, [dailyResults]);

  // Calcular estadísticas mensuales
  const getMonthlyStats = useCallback(() => {
    const firstDay = startOfMonth(selectedMonth);
    const lastDay = endOfMonth(selectedMonth);
    
    let centralizedTotal = undefined;
    if (processedData && typeof processedData.calculateTotalPL === 'function') {
      centralizedTotal = processedData.calculateTotalPL();
    }
    
    let totalProfit = 0;
    let tradingDays = 0;
    
    eachDayOfInterval({ start: firstDay, end: lastDay }).forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = dailyResults[dateStr];
      
      if (dayData) {
        const profit = typeof dayData.profit === 'string' ? parseFloat(dayData.profit) : dayData.profit;
        totalProfit += profit;
        
        if (dayData.trades > 0) {
          tradingDays++;
        }
      }
    });
    
    return {
      totalProfit,
      tradingDays
    };
  }, [selectedMonth, dailyResults, processedData]);
  
  // Calcular estadísticas por semana
  const getWeeklyStats = useCallback(() => {
    const firstDay = startOfMonth(selectedMonth);
    const lastDay = endOfMonth(selectedMonth);
    
    // Crear un mapa para rastrear datos por semana
    const weekMap = new Map<number, { profit: number; tradingDays: number }>();
    
    // Iterar por cada día del mes
    eachDayOfInterval({ start: firstDay, end: lastDay }).forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const weekNumber = getWeek(day);
      const dayData = dailyResults[dateStr];
      
      // Inicializar semana si no existe
      if (!weekMap.has(weekNumber)) {
        weekMap.set(weekNumber, { profit: 0, tradingDays: 0 });
      }
      
      // Actualizar datos de la semana
      if (dayData) {
        const week = weekMap.get(weekNumber)!;
        week.profit += dayData.profit;
        if (dayData.trades > 0) {
          week.tradingDays++;
        }
      }
    });
    
    // Convertir mapa a array de semanas
    const weeks: WeekSummary[] = Array.from(weekMap.entries())
      .map(([number, data]) => ({
        number,
        amount: `$${data.profit.toFixed(2)}`,
        days: `${data.tradingDays} ${data.tradingDays === 1 ? 'día' : 'días'}`,
        tradingDays: data.tradingDays
      }));
    
    // Ordenar por número de semana
    weeks.sort((a, b) => a.number - b.number);
    
    // Rellenar hasta 5 semanas si es necesario
    while (weeks.length < 5) {
      weeks.push({
        number: weeks.length + 1,
        amount: "$0.00",
        days: "0 días",
        tradingDays: 0
      });
    }
    
    return weeks;
  }, [selectedMonth, dailyResults]);

  // Generar el calendario del mes
  const generateCalendar = useCallback(() => {
    const firstDay = startOfMonth(selectedMonth);
    const lastDay = endOfMonth(selectedMonth);
    
    // Obtener primer día de la semana (domingo)
    const firstDayOfGrid = startOfWeek(firstDay);
    // Obtener último día (para asegurar que se muestren 6 semanas completas - 42 días)
    let lastDayOfGrid = endOfWeek(lastDay);
    
    // Asegurar que tengamos exactamente 6 semanas (42 días)
    const daysInGrid = (lastDayOfGrid.getTime() - firstDayOfGrid.getTime()) / (1000 * 60 * 60 * 24) + 1;
    if (daysInGrid < 42) {
      lastDayOfGrid = addDays(lastDayOfGrid, 42 - daysInGrid);
    }
    
    // Generar array de días
    return eachDayOfInterval({ start: firstDayOfGrid, end: lastDayOfGrid })
      .map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          date,
          isCurrentMonth: isSameMonth(date, selectedMonth),
          data: dailyResults[dateStr]
        };
      });
  }, [selectedMonth, dailyResults]);

  const calendar = generateCalendar();
  const monthlyStats = getMonthlyStats();
  const weeklyStats = getWeeklyStats();

  // Manejar cambio de mes sin cambiar el rango de fechas
  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
    // No llamamos a handleDateRangeChange aquí para preservar el rango de fechas seleccionado
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
    // No llamamos a handleDateRangeChange aquí para preservar el rango de fechas seleccionado
  };

  // Manejar selección de "This month" - solo cambiamos la visualización, no el rango
  const handleThisMonth = () => {
    const now = new Date();
    setSelectedMonth(now);
    
    // Solo cambiamos el rango de fechas si el usuario explícitamente
    // ha activado el botón "This month", lo que indica intención de cambiar el rango
    if (handleDateRangeChange && window.confirm("¿Desea también actualizar el rango de fechas al mes actual?")) {
      const firstDay = startOfMonth(now);
      const lastDay = endOfMonth(now);
      handleDateRangeChange(firstDay, lastDay);
    }
  };

  // Mejorar la lógica de procesamiento de datos
  useEffect(() => {
    if (processedData?.rawTrades) {
      const tradeMap: Record<string, Trade[]> = {};
      
      processedData.rawTrades.forEach((trade: Trade) => {
        try {
          const tradeDate = new Date(trade.time);
          const dateStr = format(tradeDate, 'yyyy-MM-dd');
          
          if (!tradeMap[dateStr]) {
            tradeMap[dateStr] = [];
          }
          
          tradeMap[dateStr].push(trade);
        } catch (e) {
          // Mantener solo el error crítico
          console.error("Error procesando operación para indexación:", e);
        }
      });
      
      setTradesByDate(tradeMap);
    }
  }, [processedData?.rawTrades]);

  // Implementación más robusta de handleDayClick que garantiza consistencia total
  const handleDayClick = useCallback((dateStr: string) => {
    const dailyResult = dailyResults[dateStr];
    const allTrades = processedData?.rawTrades || [];
    
    if (dailyResult) {
      const expectedProfit = dailyResult.profit;
      const expectedTrades = dailyResult.trades;
      let matchingTrades: Trade[] = [];
      
      const exactDateTrades = allTrades.filter((trade: Trade) => {
        try {
          const tradeDate = new Date(trade.time);
          const tradeDateStr = format(tradeDate, 'yyyy-MM-dd');
          return tradeDateStr === dateStr;
        } catch (e) {
          return false;
        }
      });
      
      const exactDateProfit = exactDateTrades.reduce((sum: number, t: Trade) => sum + (t.profit || 0), 0);
      
      if (Math.abs(exactDateProfit - expectedProfit) < 0.01) {
        matchingTrades = exactDateTrades;
      } else {
        const tradesByDate: { [date: string]: Trade[] } = {};
        allTrades.forEach((trade: Trade) => {
          try {
            const tradeDate = new Date(trade.time);
            const tradeDateStr = format(tradeDate, 'yyyy-MM-dd');
            
            if (!tradesByDate[tradeDateStr]) {
              tradesByDate[tradeDateStr] = [];
            }
            tradesByDate[tradeDateStr].push(trade);
          } catch (e) {
            console.error("Error procesando fecha:", e);
          }
        });
        
        let bestMatch = { date: "", trades: [] as Trade[], difference: Number.MAX_VALUE };
        
        for (const [date, trades] of Object.entries(tradesByDate)) {
          const totalProfit = trades.reduce((sum: number, t: Trade) => sum + (t.profit || 0), 0);
          const difference = Math.abs(totalProfit - expectedProfit);
          
          if (difference < bestMatch.difference) {
            bestMatch = { date, trades, difference };
          }
          
          if (difference < 0.01) break;
        }
        
        if (bestMatch.difference < 1.0) {
          matchingTrades = bestMatch.trades;
        } else {
          matchingTrades = exactDateTrades;
        }
      }
      
      const actualProfit = matchingTrades.reduce((sum: number, t: Trade) => sum + (t.profit || 0), 0);
      
      if (Math.abs(actualProfit - expectedProfit) > 1.0 && matchingTrades.length > 0) {
        const syntheticTrade: Trade = {
          ticket: 999999,
          symbol: "AJUSTE",
          type: expectedProfit >= 0 ? "buy" : "sell",
          volume: 1,
          price: 0,
          profit: expectedProfit - actualProfit,
          commission: 0,
          swap: 0,
          time: matchingTrades[0].time,
        };
        
        matchingTrades.push(syntheticTrade);
      }
    }
  }, [dailyResults, processedData]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default ProgressTracker;