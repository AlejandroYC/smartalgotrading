// src/components/TradingCalendar.tsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO } from 'date-fns';
import { useTradingData } from '@/contexts/TradingDataContext';
import IntraDayPLChart from './IntraDayPLChart';
import { formatTradeType, isBuyOperation, isSellOperation } from '@/utils/tradeUtils';

// Añadir nombres de meses en español como constante
const mesesEspanol = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface DayStats {
  profit: number;
  trades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
}

interface WeekStats {
  profit: number;
  tradingDays: number;
  trades: number;
}

interface DayDetails {
  date: Date;
  stats: DayStats;
  trades: any[];
}

// Interfaz para opciones de visualización
interface DisplayOptions {
  showRMultiple: boolean;
  showDailyPL: boolean;
  showTicks: boolean;
  showPips: boolean;
  showPoints: boolean;
  showNumberOfTrades: boolean;
  showDayWinrate: boolean;
}

const TradingCalendar: React.FC = () => {
  // Usar rawData en lugar de processedData para acceder a TODOS los datos sin filtro de fecha
  const { rawData, processedData, dateRange } = useTradingData();
  // Estado para seguir la fecha actual del calendario
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  // Referencia al calendario
  const calendarRef = useRef<any>(null);
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<DayDetails | null>(null);
  // Estado para el modal de selección de mes
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  
  // Estado para el modal de opciones de visualización
  const [isDisplayOptionsOpen, setIsDisplayOptionsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  
  // Estado para las opciones de visualización
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showRMultiple: true,
    showDailyPL: true,
    showTicks: true,
    showPips: true,
    showPoints: true,
    showNumberOfTrades: true,
    showDayWinrate: true
  });

  // Memoización estable de los datos calculados - USANDO DATOS COMPLETOS sin filtrar por fecha
  const { dailyStats, weeklyStats, monthlyStats, tradesByDate, totalCalendarPL } = useMemo(() => {
    const dailyStats = new Map<string, DayStats>();
    const weeklyStats = new Map<number, WeekStats>();
    const tradesByDate = new Map<string, any[]>();
    let totalCalendarPL = 0;
    let monthlyStats = {
      totalProfit: 0,
      totalTrades: 0,
      tradingDays: 0
    };

    // IMPORTANTE: Usar rawData.statistics en lugar de processedData para obtener TODOS los datos
    const dailyResults = rawData?.statistics?.daily_results || {};
    const rawTrades = rawData?.history || [];

    if (!dailyResults || !rawTrades || Object.keys(dailyResults).length === 0) {
      console.log("TradingCalendar: No hay datos completos disponibles");
      return { dailyStats, weeklyStats, monthlyStats, tradesByDate, totalCalendarPL };
    }

    console.log("TradingCalendar: Procesando datos completos sin filtro de fecha", {
      diasTotales: Object.keys(dailyResults).length,
      tradesDiarios: Object.values(dailyResults).reduce((sum: number, day: any) => sum + (day.trades || 0), 0),
      operacionesTotales: rawTrades.length
    });

    // Ordenar las fechas cronológicamente
    const sortedDates = Object.keys(dailyResults).sort();
    
    // Si no hay fechas, retornar datos vacíos
    if (sortedDates.length === 0) {
      return { dailyStats, weeklyStats, monthlyStats, tradesByDate, totalCalendarPL };
    }
    
    // Obtener el primer día del mes para calcular el offset de la primera semana
    const firstDate = new Date(sortedDates[0]);
    const firstDayOfMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const firstDayOffset = firstDayOfMonth.getDay(); // 0 = domingo, 1 = lunes, etc.
    
    // Procesar cada día
    sortedDates.forEach((dateStr) => {
      const dayData = dailyResults[dateStr];
      if (!dayData) return;
      
      const date = new Date(dateStr);
      
      // Crear estadísticas diarias
      const dayStats: DayStats = {
        profit: typeof dayData.profit === 'string' ? parseFloat(dayData.profit) : dayData.profit,
        trades: dayData.trades || 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0
      };
      
      // Actualizar total acumulado
      totalCalendarPL += dayStats.profit;
      
      // Obtener los trades del día y procesar estadísticas
      const dayTrades = rawTrades.filter((trade: any) => {
        try {
          let tradeDate: Date;
          if (typeof trade.time === 'number') {
            tradeDate = new Date(trade.time > 10000000000 ? trade.time : trade.time * 1000);
          } else {
            tradeDate = new Date(trade.time);
          }
          return tradeDate.toISOString().split('T')[0] === dateStr;
        } catch (error) {
          console.error("Error procesando fecha de trade:", error, trade);
          return false;
        }
      });
      
      if (dayTrades.length > 0) {
        const nonZeroTrades = dayTrades.filter((t: any) => parseFloat(String(t.profit || 0)) !== 0);
        dayStats.trades = nonZeroTrades.length;
        dayStats.winningTrades = nonZeroTrades.filter((t: any) => parseFloat(String(t.profit || 0)) > 0).length;
        dayStats.losingTrades = nonZeroTrades.filter((t: any) => parseFloat(String(t.profit || 0)) < 0).length;
        dayStats.winRate = dayStats.trades > 0 ? (dayStats.winningTrades / dayStats.trades) * 100 : 0;
        tradesByDate.set(dateStr, dayTrades);
      }
      
      dailyStats.set(dateStr, dayStats);
      
      // Verificar si el día está en el mes seleccionado en el calendario para las estadísticas mensuales
      const isCurrentMonth = 
        date.getMonth() === currentCalendarDate.getMonth() && 
        date.getFullYear() === currentCalendarDate.getFullYear();
        
      if (isCurrentMonth) {
        // Actualizar estadísticas mensuales solo para el mes mostrado en el calendario
        monthlyStats.totalProfit += dayStats.profit;
        monthlyStats.totalTrades += dayStats.trades;
        monthlyStats.tradingDays += dayStats.trades > 0 ? 1 : 0;
      }
      
      // Calcular el número de semana basado en el calendario real
      try {
        // Calcular la semana basada en el día del mes y el offset del primer día
        const dayOfMonth = date.getDate();
        const adjustedDay = dayOfMonth + firstDayOffset - 1;
        const weekNum = Math.floor(adjustedDay / 7) + 1;
        
        const existingWeekStats = weeklyStats.get(weekNum) || {
          profit: 0,
          tradingDays: 0,
          trades: 0
        };
        
        existingWeekStats.profit += dayStats.profit;
        existingWeekStats.trades += dayStats.trades;
        if (dayStats.trades > 0) {
          existingWeekStats.tradingDays += 1;
        }
        
        weeklyStats.set(weekNum, existingWeekStats);
      } catch (error) {
        console.error('Error procesando semana:', error);
      }
    });

    console.log("TradingCalendar: Procesamiento completado", {
      diasProcesados: dailyStats.size,
      semanasProcesadas: weeklyStats.size,
      totalProfit: totalCalendarPL
    });

    return { dailyStats, weeklyStats, monthlyStats, tradesByDate, totalCalendarPL };
  }, [rawData?.statistics?.daily_results, rawData?.history, currentCalendarDate]);

  // Renderizar eventos de calendario en lugar de personalizar celdas - Ahora con memoización estable
  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    
    // Crear un evento para cada día con trades
    dailyStats.forEach((stats, dateStr) => {
      // Determinar color según si es ganancia o pérdida
      const isProfit = stats.profit >= 0;
      const backgroundColor = isProfit ? '#dcfce7' : '#fee2e2'; // Verde claro o rosa claro
      const textColor = isProfit ? '#166534' : '#991b1b'; // Verde oscuro o rojo oscuro
      const borderColor = isProfit ? '#86efac' : '#fecaca'; // Borde verde o rojo más claro
      
      events.push({
        id: `trade-day-${dateStr}`,
        title: `$${Math.abs(stats.profit).toFixed(1)} | ${stats.trades} ${stats.trades === 1 ? 'operación' : 'operaciones'}`,
        date: dateStr,
        allDay: true,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: textColor,
        extendedProps: {
          profit: stats.profit,
          trades: stats.trades,
          winRate: stats.winRate,
          stats: stats,
          isProfit: isProfit
        }
      });
    });
    
    return events;
  }, [dailyStats]);

  // Reemplazar el renderDayCell con un eventContent personalizado - Ahora memoizado
  const renderEventContent = useCallback((eventInfo: any) => {
    const { extendedProps } = eventInfo.event;
    if (!extendedProps) return null;
    
    const { profit, trades } = extendedProps;
    const dayOfMonth = eventInfo.event.start.getDate();
    const isProfit = profit >= 0;
    
    return (
      <div className={`h-full w-full flex flex-col p-2 ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="text-xs text-gray-600 self-end">{dayOfMonth}</div>
        {displayOptions.showDailyPL && (
          <div className={`text-base font-medium mt-2 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {isProfit ? '$' : '-$'}{Math.abs(profit).toFixed(2)}
          </div>
        )}
        {displayOptions.showNumberOfTrades && (
          <div className="text-xs text-gray-600 mt-1">
            {trades} {trades === 1 ? 'trade' : 'trades'}
          </div>
        )}
        {displayOptions.showDayWinrate && (
          <div className="text-xs text-gray-600">
            {extendedProps.stats.winRate.toFixed(1)}%
          </div>
        )}
      </div>
    );
  }, [displayOptions]);

  // Manejar cambio de fechas - Ahora con estabilidad
  const handleDatesSet = useCallback((dateInfo: any) => {
    console.log('handleDatesSet called with date:', dateInfo.view.currentStart);
    setCurrentCalendarDate(dateInfo.view.currentStart);
  }, []);

  // Ir al mes actual
  const goToCurrentMonth = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      setCurrentCalendarDate(new Date());
    }
  }, []);

  // Manejar clic en un día - Ahora con estabilidad
  const handleDayClick = useCallback((dateStr: string, stats: DayStats) => {
    // Verificar si hay trades para este día
    const dayTrades = tradesByDate.get(dateStr);
    if (!dayTrades || dayTrades.length === 0) return;

    // Filtrar trades con P&L distinto de cero
    const nonZeroTrades = dayTrades.filter(trade => {
      const profit = parseFloat(String(trade.profit || 0));
      return profit !== 0;
    });

    // Si después de filtrar no quedan trades, mostrar mensaje o no abrir el modal
    if (nonZeroTrades.length === 0) {
      alert('No hay operaciones con P&L distinto de cero para este día.');
      return;
    }

    // Recalcular estadísticas excluyendo los trades con valor 0
    const filteredStats = {...stats};
    filteredStats.trades = nonZeroTrades.length;
    filteredStats.winningTrades = nonZeroTrades.filter(t => parseFloat(String(t.profit || 0)) > 0).length;
    filteredStats.losingTrades = nonZeroTrades.filter(t => parseFloat(String(t.profit || 0)) < 0).length;
    filteredStats.winRate = filteredStats.trades > 0 
      ? (filteredStats.winningTrades / filteredStats.trades) * 100 
      : 0;

    // Establecer los detalles del día seleccionado con los trades filtrados
    setSelectedDayDetails({
      date: parseISO(dateStr),
      stats: filteredStats,
      trades: nonZeroTrades
    });

    // Abrir el modal
    setIsModalOpen(true);
  }, [tradesByDate]);

  // Renderizar el modal
  const renderModal = useCallback(() => {
    if (!isModalOpen || !selectedDayDetails) return null;

    // Formatear la fecha en español
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const fecha = selectedDayDetails.date;
    const formattedDate = `${diasSemana[fecha.getDay()]}, ${meses[fecha.getMonth()]} ${fecha.getDate()}, ${fecha.getFullYear()}`;
    
    // Para propósitos de depuración, mostrar la fecha original en desarrollo
 
    
    const { stats, trades } = selectedDayDetails;

    // Determinar colores para las estadísticas basadas en el rendimiento
    const profitColor = stats.profit >= 0 ? 'text-green-600' : 'text-red-600';
    const winRateColor = stats.winRate >= 50 ? 'text-green-600' : 'text-amber-600';

    // Verificar si hay discrepancia entre el número de trades
    const totalOriginalTrades = trades.length;
    const totalNonZeroTrades = trades.filter(t => parseFloat(String(t.profit || 0)) !== 0).length;
    // La discrepancia ahora se verifica contra el conteo filtrado
    const hasTradeCountDiscrepancy = stats.trades !== totalNonZeroTrades || totalOriginalTrades > totalNonZeroTrades;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
        <div className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">{formattedDate}</h2>
              <div className={`text-lg ${profitColor} font-bold`}>
                P&L Neto ${stats.profit.toFixed(2)}
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensaje de advertencia si hay discrepancia */}
          {hasTradeCountDiscrepancy && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Nota sobre los datos</h3>
                  <div className="mt-1 text-sm text-amber-700">
                    <p>
                      La discrepancia entre el número de operaciones registradas y 
                      las mostradas se debe a que se están excluyendo las operaciones con P&L = $0.00 para 
                      una visualización más relevante de tus resultados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección superior: Gráfico y estadísticas uno al lado del otro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Gráfico de P&L Intradía */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium mb-2 text-gray-800">P&L Acumulado Intradía</h3>
              <IntraDayPLChart 
                trades={trades}
                totalProfit={stats.profit}
              />
            </div>

            {/* Información general de trading del día */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Total operaciones</div>
                <div className="text-lg font-bold text-gray-900">{stats.trades}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Ganadoras</div>
                <div className="text-lg font-bold text-green-600">{stats.winningTrades}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">P&L Bruto</div>
                <div className={`text-lg font-bold ${profitColor}`}>${stats.profit.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">% Acierto</div>
                <div className={`text-lg font-bold ${winRateColor}`}>{stats.winRate.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Perdedoras</div>
                <div className="text-lg font-bold text-red-600">{stats.losingTrades}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Volumen</div>
                <div className="text-lg font-bold text-blue-600">{stats.trades}</div>
              </div>
            </div>
          </div>

          {/* Tabla de operaciones */}
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Hora</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Ticket</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Lado</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Instrumento</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">P&L Neto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trades.map((trade, index) => {
                  // Convertir time a un formato legible
                  let tradeTime = '';
                  try {
                    if (typeof trade.time === 'string') {
                      tradeTime = new Date(trade.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    } else if (typeof trade.time === 'number') {
                      tradeTime = new Date(
                        trade.time > 10000000000 ? trade.time : trade.time * 1000
                      ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    }
                  } catch (e) {
                    tradeTime = 'Invalid';
                  }

                  const profit = parseFloat(String(trade.profit || 0));
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-black">{tradeTime}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-black">{trade.symbol || trade.ticket}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-black">{formatTradeType(trade.type)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-black">{trade.symbol || 'Desconocido'}</td>
                      <td className={`px-3 py-2 whitespace-nowrap text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${profit.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button 
              onClick={() => {
                // Implementar lógica para ver más detalles si es necesario
     
              }}
              className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    );
  }, [isModalOpen, selectedDayDetails]);

  // Efecto para estilos universales del calendario - Ahora con dependencias vacías para ejecutar solo una vez
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .fc {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .fc .fc-daygrid-day {
        background: white;
      }

      .fc .fc-daygrid-day.fc-day-today {
        background: white;
      }

      .fc .fc-col-header-cell {
        background: white;
        padding: 8px 0;
        color: #666;
        font-weight: 500;
        text-transform: uppercase;
        font-size: 12px;
      }

      .fc .fc-daygrid-day-frame {
        min-height: 100px !important;
        padding: 4px !important;
      }

      .fc .fc-daygrid-day-events {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 2em;
      }

      .fc-theme-standard td, .fc-theme-standard th {
        border: 1px solid #f0f0f0;
      }

      .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
        background: transparent;
        box-shadow: none;
      }
      
      .fc-daygrid-event-harness {
        margin: 0 !important;
      }

      .fc-h-event {
        background: transparent !important;
        border: none !important;
      }

      .fc-event {
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }

      .fc-event-main {
        padding: 0 !important;
        height: 100% !important;
      }

      .fc-daygrid-day-frame {
        height: 100% !important;
      }

      .fc td {
        height: 120px !important;
      }

      .fc-day-disabled {
        background-color: #f9f9f9 !important;
      }

      .fc-day-other {
        background-color: #f9f9f9 !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Evitar re-renderizados excesivos
  const memoizedEvents = React.useMemo(() => calendarEvents, [calendarEvents]);
  
  // Manejar evento onClick estabilizado
  const handleEventClick = useCallback((info: any) => {
    const dateStr = format(info.event.start!, 'yyyy-MM-dd');
    const stats = info.event.extendedProps.stats;
    handleDayClick(dateStr, stats);
  }, [handleDayClick]);

  // Nueva referencia para el título del mes (corregir el tipo)
  const monthTitleRef = useRef<HTMLButtonElement>(null);
  
  // Efecto para manejar clics fuera del modal para cerrarlo
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMonthSelectorOpen && monthTitleRef.current && !monthTitleRef.current.contains(e.target as Node)) {
        setIsMonthSelectorOpen(false);
      }
      
      // Cerrar el modal de opciones de visualización si se hace clic fuera
      if (isDisplayOptionsOpen && settingsButtonRef.current) {
        const targetEl = e.target as HTMLElement;
        // No cerrar si se hace clic en el botón o en un elemento dentro del modal
        if (!settingsButtonRef.current.contains(targetEl) && !targetEl.closest('.display-options-modal')) {
          setIsDisplayOptionsOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthSelectorOpen, isDisplayOptionsOpen]);

  // Función simple para cambiar el mes
  const handleMonthChange = (monthIndex: number) => {
    try {
      // Log para depuración
      console.log(`Cambiando al mes: ${monthIndex + 1} (${mesesEspanol[monthIndex]})`);
      
      // Obtener referencia a la API del calendario
      if (!calendarRef.current) {
        console.error('No se pudo acceder a la referencia del calendario');
        return;
      }
      
      // Crear nueva fecha con el mes seleccionado
      const newDate = new Date(currentCalendarDate.getFullYear(), monthIndex, 1);
      
      // Navegar al nuevo mes usando la API
      calendarRef.current.getApi().gotoDate(newDate);
      
      // Actualizar el estado
      setCurrentCalendarDate(newDate);
      
      // Cerrar el selector
      setIsMonthSelectorOpen(false);
      
      // Log de éxito
      console.log(`Mes cambiado a: ${mesesEspanol[monthIndex]}`);
    } catch (error) {
      console.error('Error al cambiar mes:', error);
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-[70%]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => calendarRef.current?.getApi().prev()}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative">
            {/* Título del mes que se puede hacer clic */}
            <button
              onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
              className="text-xl font-medium text-gray-900 bg-transparent border-none appearance-none flex items-center"
            >
            {mesesEspanol[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Modal selector de mes */}
            {isMonthSelectorOpen && (
              <div className="absolute top-10 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-72">
                <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-gray-50">
                  <span className="font-semibold text-gray-800">{currentCalendarDate.getFullYear()}</span>
                  <button
                    onClick={() => setIsMonthSelectorOpen(false)}
                    className="text-gray-600 hover:text-gray-800 transition-colors py-1 px-3 rounded hover:bg-gray-100"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {mesesEspanol.map((mes, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        console.log(`Cambiando al mes: ${mes}`);
                        const newDate = new Date(currentCalendarDate.getFullYear(), index, 1);
                        if (calendarRef.current) {
                          const api = calendarRef.current.getApi();
                          api.gotoDate(newDate);
                          setCurrentCalendarDate(newDate);
                          setIsMonthSelectorOpen(false);
                        }
                      }}
                      className={`
                        py-2 px-2 text-center rounded-md 
                        ${currentCalendarDate.getMonth() === index 
                          ? 'bg-indigo-600 text-white font-medium' 
                          : 'hover:bg-gray-100 text-gray-700'}
                      `}
                    >
                      {mes.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => calendarRef.current?.getApi().next()}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            onClick={goToCurrentMonth}
            className="ml-4 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Este mes
          </button>
          </div>

        <div className="flex items-center gap-4 text-sm">
          <div>Estadísticas mensuales:</div>
          {displayOptions.showDailyPL && (
            <div className={`${monthlyStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {monthlyStats.totalProfit >= 0 ? '$' : '-$'}{Math.abs(monthlyStats.totalProfit).toFixed(2)}
            </div>
          )}
          {displayOptions.showNumberOfTrades && (
            <div>{monthlyStats.tradingDays} días</div>
          )}
          <div className="relative group">
            <button className="p-2 text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="absolute right-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black text-white text-sm p-2 rounded-md shadow-md whitespace-nowrap">
                Resumen visual de tu mes de trading
              </div>
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-black transform rotate-45"></div>
            </div>
          </div>
          <div className="relative">
            <button 
              ref={settingsButtonRef}
              className="p-2 text-gray-600 hover:text-gray-800"
              onClick={(e) => {
                e.stopPropagation();
                setIsDisplayOptionsOpen(!isDisplayOptionsOpen);
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {isDisplayOptionsOpen && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50 display-options-modal">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <span className="font-semibold text-gray-800">Display stats</span>
                </div>
                <div className="p-3 max-h-60 overflow-y-auto">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        checked={displayOptions.showRMultiple}
                        onChange={(e) => setDisplayOptions({...displayOptions, showRMultiple: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">R Multiple</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        checked={displayOptions.showDailyPL}
                        onChange={(e) => setDisplayOptions({...displayOptions, showDailyPL: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Daily P/L</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        checked={displayOptions.showTicks}
                        onChange={(e) => setDisplayOptions({...displayOptions, showTicks: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Ticks</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        checked={displayOptions.showPips}
                        onChange={(e) => setDisplayOptions({...displayOptions, showPips: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Pips</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        checked={displayOptions.showPoints}
                        onChange={(e) => setDisplayOptions({...displayOptions, showPoints: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Points</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        checked={displayOptions.showNumberOfTrades}
                        onChange={(e) => setDisplayOptions({...displayOptions, showNumberOfTrades: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Number of trades</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                        checked={displayOptions.showDayWinrate}
                        onChange={(e) => setDisplayOptions({...displayOptions, showDayWinrate: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Day winrate</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendario oculto para gestionar la lógica */}
      <div className="hidden">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          ref={calendarRef}
          headerToolbar={false}
          events={memoizedEvents}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          height="auto"
          datesSet={handleDatesSet}
        />
      </div>

      {/* Contenedor de la cuadrícula del calendario */}
      <div className="w-full">
        <div className="grid grid-cols-8 gap-x-2 mb-2 border-b border-gray-200">
          <div className="text-center py-1 font-medium text-gray-700 text-sm border border-gray-200 rounded-lg">DOM</div>
          <div className="text-center py-1 font-medium text-gray-700 text-sm border border-gray-200 rounded-lg">LUN</div>
          <div className="text-center py-1 font-medium text-gray-700 text-sm border border-gray-200 rounded-lg">MART</div>
          <div className="text-center py-1 font-medium text-gray-700 text-sm border border-gray-200 rounded-lg">MIER</div>
          <div className="text-center py-1 font-medium text-gray-700 text-sm border border-gray-200 rounded-lg">JUE</div>
          <div className="text-center py-1 font-medium text-gray-700 text-sm border border-gray-200 rounded-lg">VIE</div>
          <div className="text-center py-1 font-medium text-gray-700 text-sm border border-gray-200 rounded-lg">SAB</div>
          <div className="text-left py-1 font-medium text-gray-700 text-sm"></div>
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-8 gap-x-1 gap-y-1">
          {(() => {
            // Preparar datos del calendario
            const result = [];
            const currentMonth = currentCalendarDate.getMonth();
            const currentYear = currentCalendarDate.getFullYear();
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            const firstDayOffset = firstDayOfMonth.getDay(); // 0 = domingo
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            // Generar 6 semanas
            for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
              const weekNum = weekIndex + 1;
              
              // Recalcular las estadísticas de la semana basadas en los días que se muestran
              let weekStats = {
                profit: 0,
                tradingDays: 0,
                trades: 0
              };
              
              // Array para almacenar los días de esta semana que tienen datos
              const weekDays = [];
              
              // Para cada día de la semana
              for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const dayOfMonth = 1 + (weekIndex * 7 + dayIndex) - firstDayOffset;
                const isCurrentMonth = dayOfMonth > 0 && dayOfMonth <= lastDayOfMonth;
                const date = new Date(currentYear, currentMonth, dayOfMonth);
                const dateStr = isCurrentMonth ? format(date, 'yyyy-MM-dd') : '';
                const isOtherMonth = !isCurrentMonth;
                const dayStats = isCurrentMonth ? dailyStats.get(dateStr) : null;
                
                // Si el día tiene estadísticas, acumularlas para esta semana
                if (dayStats) {
                  weekStats.profit += dayStats.profit;
                  weekStats.trades += dayStats.trades;
                  if (dayStats.trades > 0) {
                    weekStats.tradingDays += 1;
                  }
                  weekDays.push(dayOfMonth);
                }
                
                // Añadir celda de día
                result.push(
                  <div 
                    key={`day-${weekIndex}-${dayIndex}`} 
                    className={`relative border border-gray-100 min-h-[115px] ${isOtherMonth ? 'bg-gray-50' : 'bg-gray-100'}`}
                    onClick={() => dayStats && handleDayClick(dateStr, dayStats)}
                  >
                    {isCurrentMonth && (
                      <div className="absolute top-1 right-2">
                        <span className="text-sm text-gray-800 font-medium">
                          {dayOfMonth}
                        </span>
                      </div>
                    )}
                    
                    {/* Contenido del día si hay datos */}
                    {dayStats ? (
                      <div 
                        className={`absolute inset-0 rounded-md border ${
                          dayStats.profit >= 0 
                            ? 'bg-green-100 border-green-500' 
                            : 'bg-red-100 border-red-500'
                        }`}
                      >
                        <div className="absolute top-1 right-2">
                          <span className="text-sm text-gray-800 font-medium">
                            {dayOfMonth}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end justify-center h-full pr-2 pt-2">
                          {/* P&L diario - Mostrar solo si la opción está activada */}
                          {displayOptions.showDailyPL && (
                            <div className="text-base font-semibold text-gray-800">
                              {dayStats.profit >= 0 ? '' : '-'}${Math.abs(dayStats.profit).toFixed(1)}
                            </div>
                          )}
                          
                          {/* Número de trades - Mostrar solo si la opción está activada */}
                          {displayOptions.showNumberOfTrades && (
                            <div className="text-xs text-gray-600 mt-0.5">
                              {dayStats.trades} {dayStats.trades === 1 ? 'trade' : 'trades'}
                            </div>
                          )}
                          
                          {/* Day winrate - Mostrar solo si la opción está activada */}
                          {displayOptions.showDayWinrate && (
                            <div className="text-xs text-gray-600 mt-0.5">
                              {Number(dayStats.winRate).toFixed(2).replace(/\.0+$/, '')}%
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }
              
              const hasData = weekStats.tradingDays > 0;
              
              // Añadir resumen semanal al final de cada semana
              result.push(
                <div key={`week-summary-${weekIndex}`} className="bg-white border border-gray-200 rounded-lg min-h-[110px]">
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">Week {weekNum}</div>
                    {displayOptions.showDailyPL && (
                      <div className={`text-base font-semibold ${weekStats.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {weekStats.profit >= 0 ? '$' : '-$'}{Math.abs(weekStats.profit).toFixed(2)}
                      </div>
                    )}
                    {displayOptions.showNumberOfTrades && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {weekStats.tradingDays} {weekStats.tradingDays === 1 ? 'day' : 'days'}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            
            return result;
          })()}
        </div>
      </div>

      {isModalOpen && selectedDayDetails && renderModal()}
    </div>
  );
};

// Exportar el componente con React.memo para evitar renders innecesarios
export default React.memo(TradingCalendar);