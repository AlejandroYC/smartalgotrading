// src/components/TradingCalendar.tsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO } from 'date-fns';
import { useTradingData } from '@/contexts/TradingDataContext';
import IntraDayPLChart from './IntraDayPLChart';
import { formatTradeType, isBuyOperation, isSellOperation } from '@/utils/tradeUtils';

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

const TradingCalendar: React.FC = () => {
  const { processedData, dateRange } = useTradingData();
  // Estado para seguir la fecha actual del calendario
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  // Referencia al calendario
  const calendarRef = useRef<any>(null);
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState<DayDetails | null>(null);

  // Memoización estable de los datos calculados
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

    // IMPORTANTE: Utilizar daily_results para mantener consistencia con otros componentes
    if (!processedData?.daily_results || !processedData?.rawTrades) {
      return { dailyStats, weeklyStats, monthlyStats, tradesByDate, totalCalendarPL };
    }

    // CAMBIO IMPORTANTE: Usar los daily_results para las estadísticas diarias para mantener consistencia
    // con otros componentes, en lugar de recalcular desde rawTrades
    Object.entries(processedData.daily_results).forEach(([dateStr, dayData]: [string, any]) => {
      if (!dayData) return;
      
      // Crear estadísticas diarias basadas en los datos ya calculados
      const dayStats: DayStats = {
        profit: typeof dayData.profit === 'string' ? parseFloat(dayData.profit) : dayData.profit,
        trades: dayData.trades || 0,
        winningTrades: 0, // No tenemos este dato en daily_results
        losingTrades: 0,  // No tenemos este dato en daily_results
        winRate: 0        // Lo calcularemos después si es posible
      };
      
      // Total acumulado para verificación
      totalCalendarPL += dayStats.profit;
      
      // Buscar los trades de este día para información adicional y detalles
      // IMPORTANTE: Usar el mismo método de filtrado por fecha que se usa en el contexto
      // para asegurar consistencia en los resultados
      const dayTrades = processedData.rawTrades.filter((trade: any) => {
        try {
          let tradeDate: Date;
          // Convertir el timestamp a Date de manera consistente
          if (typeof trade.time === 'number') {
            // Si es un timestamp en segundos (formato MT5), convertir a milisegundos
            tradeDate = new Date(trade.time > 10000000000 ? trade.time : trade.time * 1000);
          } else {
            // Si es un string, parsearlo directamente
            tradeDate = new Date(trade.time);
          }
          
          // Usar el formato YYYY-MM-DD para comparar fechas
          const tradeDateStr = tradeDate.toISOString().split('T')[0];
          return tradeDateStr === dateStr;
        } catch (error) {
          console.error("Error procesando fecha de trade:", error, trade);
          return false;
        }
      });
      
      // Calcular estadísticas adicionales a partir de los trades
      if (dayTrades.length > 0) {
        // Filtrar trades con P&L distinto de cero para estadísticas más relevantes
        const nonZeroTrades = dayTrades.filter((t: any) => parseFloat(String(t.profit || 0)) !== 0);
        
        // Actualizar el contador de operaciones para mostrar solo las relevantes
        dayStats.trades = nonZeroTrades.length;
        
        // Calcular estadísticas solo con operaciones relevantes (no cero)
        dayStats.winningTrades = nonZeroTrades.filter((t: any) => parseFloat(String(t.profit || 0)) > 0).length;
        dayStats.losingTrades = nonZeroTrades.filter((t: any) => parseFloat(String(t.profit || 0)) < 0).length;
        dayStats.winRate = dayStats.trades > 0 
          ? (dayStats.winningTrades / dayStats.trades) * 100 
          : 0;
        
        // Guardar todos los trades para poder filtrar después en el modal
        tradesByDate.set(dateStr, dayTrades);
      }
      
      // Almacenar estadísticas del día
      dailyStats.set(dateStr, dayStats);
      
      // Actualizar estadísticas mensuales
      monthlyStats.totalProfit += dayStats.profit;
      monthlyStats.totalTrades += dayStats.trades;
      monthlyStats.tradingDays += 1;
      
      // Actualizar estadísticas semanales
      try {
        const date = new Date(dateStr);
        const weekNum = Math.ceil(date.getDate() / 7);
        
        const weekStats = weeklyStats.get(weekNum) || {
          profit: 0,
          tradingDays: 0,
          trades: 0
        };
        
        weekStats.profit += dayStats.profit;
        weekStats.trades += dayStats.trades;
        weekStats.tradingDays += 1;
        
        weeklyStats.set(weekNum, weekStats);
      } catch (error) {
        console.error('Error procesando semana:', error);
      }
    });
    

    return { dailyStats, weeklyStats, monthlyStats, tradesByDate, totalCalendarPL };
  }, [processedData?.daily_results, processedData?.rawTrades]);

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
    
    const { profit, trades, winRate, isProfit } = extendedProps;
    
    // Obtener el día del mes del evento
    const dayOfMonth = eventInfo.event.start.getDate();
    
    // Usar el color adecuado para el texto según si es ganancia o pérdida
    const profitTextColor = isProfit ? 'text-green-700' : 'text-red-600';
    
    return (
      <div className="event-cell h-full w-full flex flex-col items-center justify-center p-1 relative cursor-pointer" 
           style={{ height: '100%', minHeight: '80px' }}>
        {/* Número del día en la esquina superior derecha */}
        <div className="absolute top-1 right-2 text-xs font-medium text-gray-800 cursor-pointer">
          {dayOfMonth}
        </div>
        
        <div className={`text-xl font-bold ${profitTextColor} mt-3 cursor-pointer`}>
          ${Math.abs(profit).toFixed(1)}
          </div>
        <div className="text-xs font-medium text-gray-800 cursor-pointer">
          {trades} {trades === 1 ? 'operación' : 'operaciones'}
          </div>
        <div className="text-xs text-gray-700 cursor-pointer">
          {winRate.toFixed(1)}% acierto
        </div>
      </div>
    );
  }, []);

  // Manejar cambio de fechas - Ahora con estabilidad
  const handleDatesSet = useCallback((dateInfo: any) => {
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
      /* Estilos básicos para el calendario */
      .fc .fc-daygrid-day-events {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        pointer-events: none;
      }
      
      .fc-event {
        pointer-events: auto !important;
        margin: 1px !important;
        width: calc(100% - 2px) !important;
        height: calc(100% - 2px) !important;
        min-height: 80px !important;
        box-sizing: border-box !important;
        border: none !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        transition: all 0.2s ease-in-out !important;
      }
      
      /* Efecto de zoom al hacer hover */
      .fc-event:hover {
        transform: scale(1.02) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        z-index: 10 !important;
      }
      
      .fc-daygrid-event-harness {
        width: 100% !important;
        height: 100% !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .fc-h-event .fc-event-main {
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
      }
      
      /* Hacer más grande la altura mínima de las celdas */
      .fc .fc-daygrid-day-frame {
        min-height: 100px !important;
      }
      
      /* Estilo para el día de hoy */
      .fc .fc-day-today {
        background-color: rgba(236, 242, 255, 0.3) !important;
      }
      
      /* Borde más elegante para el contenedor del calendario */
      .fc {
        border-radius: 10px !important;
        overflow: hidden !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
      }
      
      /* Estilo más suave para los bordes de las celdas */
      .fc th, .fc td {
        border-color: rgba(226, 232, 240, 0.8) !important;
      }
      
      /* Estilo para encabezados de días de la semana */
      .fc-col-header-cell {
        background-color: rgba(249, 250, 251, 0.9) !important;
        font-weight: 600 !important;
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-black">Calendario de Trading</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={goToCurrentMonth}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm"
          >
            Mes actual
          </button>
          <div className="text-sm text-black">
            P&L Total: <span className={totalCalendarPL >= 0 ? 'text-green-500' : 'text-red-500'}>
              ${totalCalendarPL.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 text-black text-sm">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          ref={calendarRef}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          locale="es"
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
          }}
          events={memoizedEvents}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          height="auto"
          datesSet={handleDatesSet}
          rerenderDelay={10}
          eventDurationEditable={false}
          eventStartEditable={false}
          eventResizableFromStart={false}
          stickyHeaderDates={false}
          progressiveEventRendering={true}
        />
      </div>

      {isModalOpen && selectedDayDetails && renderModal()}
    </div>
  );
};

// Exportar el componente con React.memo para evitar renders innecesarios
export default React.memo(TradingCalendar);