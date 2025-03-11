'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, isSameDay, parseISO, startOfMonth, endOfMonth, isEqual } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useTradingData } from '@/contexts/TradingDataContext';
import { Trade } from '@/types/Trade';
import toast from 'react-hot-toast';

// Componente para el ícono de información
const InfoIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="text-[#333333]"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

interface ProgressTrackerProps {
  onDayClick?: (date: string) => void;
  handleDateRangeChange?: (fromDate: Date, toDate: Date) => void;
}

// Exact color palette from the image - blue tones
const ACTIVITY_COLORS = [
  '#FFFFFF', // No trades (white)
  '#F3F4F8', // Very light blue-gray
  '#E6E9F5', // Light blue-gray
  '#D5DCF5', // Medium blue-gray
  '#A5B4E8', // Medium blue
  '#7B96E5', // Stronger blue
];

// Interfaz para representar un día del calendario
interface CalendarDay {
  date: Date;
  dayOfWeek: number;
  trades: number;
  month: string;
  active: boolean;
  profit: number;
}

// Para determinar si es un día activo de trading (lun-vie)
const isActiveDay = (dayOfWeek: number): boolean => {
  return dayOfWeek > 0 && dayOfWeek < 6; // 0 = domingo, 6 = sábado
};

// Función para obtener el nivel de actividad basado en la cantidad de trades
const getActivityLevel = (trades: number): number => {
  if (trades <= 0) return 0;
  if (trades <= 2) return 1;
  if (trades <= 5) return 2;
  if (trades <= 8) return 3;
  if (trades <= 12) return 4;
  return 5;
};

// Componente principal
const ProgressTrackerNew: React.FC<ProgressTrackerProps> = ({ onDayClick, handleDateRangeChange }) => {
  // Obtener datos reales del contexto
  const tradingData = useTradingData();
  
  // Acceder a los datos desde processedData
  const processedData = tradingData.processedData || {};
  const dailyResults = processedData.daily_results || {};
  
  console.log('ProgressTrackerNew: Datos procesados encontrados:', Object.keys(dailyResults).length);
  
  // Estados para manejar la navegación y visualización
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [tooltipInfo, setTooltipInfo] = useState<{date: Date, info: string} | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDay[][]>([]);
  const [todayScore, setTodayScore] = useState({
    current: 0,
    total: 5,
    percentage: 0
  });
  
  // Verificar que tenemos datos y mostrar algunos para debug
  useEffect(() => {
    console.log(`Días con resultados: ${Object.keys(dailyResults).length}`);
    if (Object.keys(dailyResults).length > 0) {
      const sampleKey = Object.keys(dailyResults)[0];
      console.log('Ejemplo de un día:', sampleKey, dailyResults[sampleKey]);
    }
  }, [dailyResults]);
  
  // Organizar trades por fecha para acceso rápido
  const tradesByDate = useMemo(() => {
    console.log('Organizando trades por fecha, total días:', Object.keys(dailyResults).length);
    const byDate: Record<string, {trades: number, profit: number}> = {};
    
    // Transformamos dailyResults a nuestro formato
    Object.entries(dailyResults).forEach(([dateStr, dayData]) => {
      try {
        // Verificar que la fecha es válida
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.error('Fecha inválida en dailyResults:', dateStr);
          return;
        }
        
        byDate[dateStr] = {
          trades: (dayData as any)?.trades || 0,
          profit: (dayData as any)?.profit || 0
        };
      } catch (err) {
        console.error('Error procesando día:', dateStr, err);
      }
    });
    
    // Mostrar algunas estadísticas para debug
    console.log('Total de días procesados:', Object.keys(byDate).length);
    if (Object.keys(byDate).length > 0) {
      console.log('Ejemplo de un día procesado:', Object.entries(byDate)[0]);
    }
    
    return byDate;
  }, [dailyResults]);
  
  // Generar datos reales para el calendario
  const generateCalendarData = () => {
    console.log('Generando datos del calendario...');
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Nombres de los meses que queremos mostrar (según la imagen)
    const months = [
      format(subMonths(currentMonth, 1), 'MMM', { locale: es }).toLowerCase(),
      format(currentMonth, 'MMM', { locale: es }).toLowerCase(),
      format(addMonths(currentMonth, 1), 'MMM', { locale: es }).toLowerCase()
    ];
    
    console.log('Meses a mostrar:', months);
    
    // Generamos datos para 3 meses
    const data: CalendarDay[][] = Array(7).fill(0).map(() => []);
    
    // Para cada día de la semana (7 filas)
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      // Para cada semana (tenemos 8 columnas por mes en la imagen)
      for (let week = 0; week < 8; week++) {
        for (let monthIndex = 0; monthIndex < 3; monthIndex++) {
          const date = new Date(
            startDate.getFullYear(), 
            startDate.getMonth() + monthIndex, 
            1 + dayOfWeek + (week * 7)
          );
          
          // Verificar si la fecha sigue dentro del mes actual
          if (date.getMonth() !== (startDate.getMonth() + monthIndex) % 12) {
            continue;
          }
          
          // Determinar si es un día activo y la cantidad de trades
          const active = isActiveDay(dayOfWeek);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dailyData = tradesByDate[dateStr] || { trades: 0, profit: 0 };
          
          // Para debug, si hay trades en este día, mostrar
          if (dailyData.trades > 0) {
            console.log(`Encontrados ${dailyData.trades} trades para ${dateStr}`);
          }
          
          data[dayOfWeek].push({
            date,
            dayOfWeek,
            trades: dailyData.trades,
            profit: dailyData.profit,
            month: months[monthIndex],
            active
          });
        }
      }
    }
    
    // Debug: mostrar algunos datos generados
    let totalTradesFound = 0;
    data.forEach((row, index) => {
      const tradesInRow = row.reduce((sum, day) => sum + day.trades, 0);
      totalTradesFound += tradesInRow;
      if (tradesInRow > 0) {
        console.log(`Fila ${index} (${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][index]}) tiene ${tradesInRow} trades`);
      }
    });
    
    console.log(`Total trades encontrados en calendario: ${totalTradesFound}`);
    
    return data;
  };
  
  // Generar datos al cargar o cambiar el mes o los trades
  useEffect(() => {
    console.log('Actualizando datos del calendario...');
    const data = generateCalendarData();
    setCalendarData(data);
    
    // Verificar que se generaron datos
    const totalTrades = data.flat().reduce((sum, day) => sum + day.trades, 0);
    console.log(`Total de trades mostrados en el calendario: ${totalTrades}`);
    
  }, [currentMonth, tradesByDate]);
  
  // Calcular el score de hoy basado en operaciones reales
  useEffect(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    console.log('Calculando score para hoy:', todayStr);
    
    const todayData = dailyResults[todayStr];
    
    if (todayData && (todayData as any)?.trades > 0) {
      console.log(`Hay ${todayData.trades} trades hoy`);
      // Si tenemos acceso a los trades individuales podríamos calcular las operaciones ganadoras
      // Como no tenemos esa información, usaremos un aproximado basado en el profit
      const winningTradesEstimate = (todayData as any)?.profit > 0 ? Math.ceil((todayData as any)?.trades / 2) : 0;
      const scoreTotal = 5; // Meta diaria
      
      console.log(`Trades ganadores estimados hoy: ${winningTradesEstimate}/${scoreTotal}`);
      
      setTodayScore({
        current: winningTradesEstimate,
        total: scoreTotal,
        percentage: Math.min(100, (winningTradesEstimate / scoreTotal) * 100)
      });
    } else {
      console.log('No hay trades hoy');
      // No hay trades hoy
      setTodayScore({
        current: 0,
        total: 5,
        percentage: 0
      });
    }
  }, [dailyResults]);
  
  // Función para navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    console.log(`Navegando al mes ${direction === 'prev' ? 'anterior' : 'siguiente'}`);
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
    
    // Opcionalmente actualizar el rango de fechas para todo el dashboard
    if (handleDateRangeChange) {
      const newMonth = direction === 'prev' 
        ? subMonths(currentMonth, 1) 
        : addMonths(currentMonth, 1);
      
      const start = startOfMonth(newMonth);
      const end = endOfMonth(newMonth);
      
      handleDateRangeChange(start, end);
    }
  };
  
  // Manejar clic en una celda
  const handleDayClick = (day: CalendarDay) => {
    const dateStr = format(day.date, 'yyyy-MM-dd');
    console.log(`Clic en día ${dateStr}, trades: ${day.trades}`);
    
    const dailyData = tradesByDate[dateStr];
    
    if (dailyData && dailyData.trades > 0) {
      const formattedDate = format(day.date, 'dd/MM/yyyy');
      const profitText = day.profit >= 0 
        ? `+$${day.profit.toFixed(2)}` 
        : `-$${Math.abs(day.profit).toFixed(2)}`;
      
      const message = `${formattedDate} - ${day.trades} operaciones - ${profitText}`;
      console.log('Mostrando info:', message);
      
      setTooltipInfo({
        date: day.date,
        info: message
      });
      
      if (onDayClick) {
        onDayClick(dateStr);
      }
    } else {
      setTooltipInfo(null);
      toast('No hay operaciones para este día');
    }
  };
  
  // Si no hay datos disponibles
  if (!dailyResults || Object.keys(dailyResults).length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 w-full min-h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No hay datos de trading disponibles.</p>
      </div>
    );
  }
  
  // Verificar si hay trading days en el calendario
  const totalTradesInCalendar = calendarData.flat().reduce((sum, day) => sum + day.trades, 0);
  
  return (
    <div className="bg-white w-full">
      {/* Header with border bottom */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-[#2D3748] text-2xl font-medium">Progress tracker</h2>
          <InfoIcon />
          <span className="ml-1 bg-[#FFEAA0] text-[#92400E] text-sm px-4 py-1 rounded-full font-medium">
            BETA
          </span>
        </div>
        <div className="text-[#6366F1] text-lg font-medium">
          View more
        </div>
      </div>

      {/* Calendar section */}
      <div className="p-6">
        {/* Month headers */}
        <div className="grid grid-cols-[100px_repeat(24,1fr)] mb-4">
          <div></div>
          {['ene', 'feb', 'mar'].map(month => (
            <div key={month} className="col-span-8 text-center text-[#6366F1] font-medium text-lg">
              {month}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {calendarData.map((row, rowIndex) => {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return (
            <div key={rowIndex} className="grid grid-cols-[100px_repeat(24,1fr)] mb-2">
              <div className="text-[#4A5568] font-medium text-lg">{dayNames[rowIndex]}</div>
              {row.map((day, dayIndex) => {
                const bgColor = day.active
                  ? day.trades > 0
                    ? ACTIVITY_COLORS[getActivityLevel(day.trades)]
                    : ACTIVITY_COLORS[1]
                  : 'white';
                const borderClass = !day.active ? 'border border-[#E2E8F0]' : '';
                
                return (
                  <div
                    key={`${rowIndex}-${dayIndex}`}
                    className={`aspect-square ${borderClass} rounded-sm cursor-pointer 
                      hover:ring-1 hover:ring-[#6366F1] transition-all relative`}
                    style={{ backgroundColor: bgColor }}
                    onClick={() => handleDayClick(day)}
                  >
                    {tooltipInfo && isSameDay(day.date, tooltipInfo.date) && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1
                        bg-[#1A202C] text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                        {tooltipInfo.info}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Color legend */}
        <div className="flex items-center justify-end mt-6 gap-2">
          <span className="text-[#4A5568] text-sm">Less</span>
          {ACTIVITY_COLORS.slice(1).map((color, index) => (
            <div
              key={index}
              className="w-5 h-5 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[#4A5568] text-sm">More</span>
        </div>
      </div>

      {/* TODAY'S SCORE section */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[#2D3748] font-bold uppercase text-sm">TODAY'S SCORE</h3>
            <InfoIcon />
          </div>
          <button className="bg-white border border-gray-300 rounded-full px-6 py-2 text-[#2D3748] font-medium hover:bg-gray-50 transition-colors">
            Daily Checklist
          </button>
        </div>
        
        <div className="flex items-center">
          <div className="text-[#2D3748] text-3xl font-bold mr-4">
            {todayScore.current}/{todayScore.total}
          </div>
          <div className="flex-1 bg-[#EDF2F7] rounded-full h-3">
            <div 
              className="bg-[#6366F1] h-3 rounded-full" 
              style={{ width: `${todayScore.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackerNew; 