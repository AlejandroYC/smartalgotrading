// src/components/TradingCalendar.tsx
import React, { useMemo, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { format, parseISO } from 'date-fns';
import { useTradingData } from '@/contexts/TradingDataContext';
import IntraDayPLChart from './IntraDayPLChart';

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

  const { dailyStats, weeklyStats, monthlyStats, tradesByDate } = useMemo(() => {
    const dailyStats = new Map<string, DayStats>();
    const weeklyStats = new Map<number, WeekStats>();
    const tradesByDate = new Map<string, any[]>();
    let monthlyStats = {
      totalProfit: 0,
      totalTrades: 0,
      tradingDays: 0
    };

    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      console.log('No hay trades disponibles para procesar');
      return { dailyStats, weeklyStats, monthlyStats, tradesByDate };
    }

    // NUEVO: Crear un nuevo array con trades deduplicados por ticket para verificación
    const processedTickets = new Set<number>();
    const uniqueTrades: any[] = [];

    processedData.rawTrades.forEach((trade: any) => {
      if (!trade.ticket || processedTickets.has(trade.ticket)) return;
      processedTickets.add(trade.ticket);
      uniqueTrades.push(trade);
    });

    console.log(`TradingCalendar: Trades originales: ${processedData.rawTrades.length}, Trades únicos: ${uniqueTrades.length}`);

    // Ahora usamos uniqueTrades en lugar de processedData.rawTrades
    // para el resto del procesamiento
    
    // Agrupar por fecha
    const tradesByDay = new Map<string, any[]>();
    
    uniqueTrades.forEach((trade: any) => {
      try {
        // Convertir la fecha a formato estándar
        let tradeDate;
        if (typeof trade.time === 'string') {
          tradeDate = new Date(trade.time);
        } else if (typeof trade.time === 'number') {
          tradeDate = new Date(
            trade.time > 10000000000 ? trade.time : trade.time * 1000
          );
        } else {
          return;
        }
        
        const dateStr = format(tradeDate, 'yyyy-MM-dd');
        
        if (!tradesByDay.has(dateStr)) {
          tradesByDay.set(dateStr, []);
        }
        
        tradesByDay.get(dateStr)?.push(trade);
      } catch (error) {
        console.error('Error procesando fecha:', error);
      }
    });
    
    // Procesar estadísticas diarias
    tradesByDay.forEach((dayTrades, dateStr) => {
      // Verificación adicional: Imprimir los trades de cada día para comprobar
      console.log(`Día ${dateStr}: ${dayTrades.length} trades`);
      dayTrades.forEach(trade => {
        console.log(`  - Ticket: ${trade.ticket}, Profit: ${trade.profit}`);
      });
      
      const dayStats: DayStats = {
        profit: 0,
        trades: dayTrades.length,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0
      };
      
      dayTrades.forEach(trade => {
        const profit = parseFloat(String(trade.profit || 0));
        dayStats.profit += profit;
        
        if (profit > 0) dayStats.winningTrades++;
        if (profit < 0) dayStats.losingTrades++;
      });
      
      dayStats.winRate = dayStats.trades > 0 
        ? (dayStats.winningTrades / dayStats.trades) * 100 
        : 0;
      
      dailyStats.set(dateStr, dayStats);
      tradesByDate.set(dateStr, dayTrades);
      
      // Actualizar estadísticas mensuales
      monthlyStats.totalProfit += dayStats.profit;
      monthlyStats.totalTrades += dayStats.trades;
      
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
    
    monthlyStats.tradingDays = dailyStats.size;
    
    return { dailyStats, weeklyStats, monthlyStats, tradesByDate };
  }, [processedData?.rawTrades]);

  const renderDayCell = (info: any) => {
    const dateStr = format(info.date, 'yyyy-MM-dd');
    const stats = dailyStats.get(dateStr);

    // Verificar si el día pertenece al mes actual
    const isOtherMonth = info.view.calendar.getDate().getMonth() !== info.date.getMonth();
    
    // Celda base para días sin operaciones o de meses adyacentes
    if (!stats || isOtherMonth) {
      return (
        <div className={`h-full w-full p-1 ${isOtherMonth ? 'opacity-40' : ''}`}>
          <div className="text-right text-xs text-gray-600">{info.dayNumberText}</div>
        </div>
      );
    }

    // Determinar estilos según rendimiento
    let cellStyles = {};
    let bgColorClass = '';
    let textColorClass = '';
    
    if (stats.profit > 0) {
      bgColorClass = 'bg-green-100';
      textColorClass = 'text-green-700';
      cellStyles = {
        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        borderColor: '#86efac',
      };
    } else if (stats.profit < 0) {
      bgColorClass = 'bg-red-100';
      textColorClass = 'text-red-700';
      cellStyles = {
        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        borderColor: '#fca5a5',
      };
    } else {
      bgColorClass = 'bg-gray-100';
      textColorClass = 'text-gray-700';
      cellStyles = {
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        borderColor: '#d1d5db',
      };
    }
    
    // Hacer que el div sea clicable para abrir el modal
    return (
      <div 
        style={cellStyles}
        className={`h-full w-full flex flex-col rounded-lg shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 p-1`} 
        onClick={() => handleDayClick(dateStr, stats)}
      >
        <div className="text-right text-xs font-medium text-gray-700">
          {info.dayNumberText}
        </div>
        <div className="flex-grow flex flex-col justify-center items-center mt-1 text-center">
          <div className={`text-base font-bold ${textColorClass}`}>
            ${Math.abs(stats.profit).toFixed(1)}
          </div>
          <div className="text-xs font-medium text-gray-800">
            {stats.trades} {stats.trades === 1 ? 'trade' : 'trades'}
          </div>
          <div className="text-xs text-gray-700">
            {stats.winRate.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  };

  const handleDatesSet = (dateInfo: any) => {
    setCurrentCalendarDate(dateInfo.view.currentStart);
  };

  const goToCurrentMonth = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      setCurrentCalendarDate(new Date());
    }
  };

  // Manejar clic en un día
  const handleDayClick = (dateStr: string, stats: DayStats) => {
    // Verificar si hay trades para este día
    const dayTrades = tradesByDate.get(dateStr);
    if (!dayTrades || dayTrades.length === 0) return;

    // Establecer los detalles del día seleccionado
    setSelectedDayDetails({
      date: new Date(dateStr),
      stats,
      trades: dayTrades
    });

    // Abrir el modal
    setIsModalOpen(true);
  };

  // Renderizar el modal
  const renderModal = () => {
    if (!isModalOpen || !selectedDayDetails) return null;

    // Formatear la fecha como "Mon, Mar 03, 2025"
    const formattedDate = format(selectedDayDetails.date, 'EEE, MMM dd, yyyy');
    const { stats, trades } = selectedDayDetails;

    // Determinar colores para las estadísticas basadas en el rendimiento
    const profitColor = stats.profit >= 0 ? 'text-green-600' : 'text-red-600';
    const winRateColor = stats.winRate >= 50 ? 'text-green-600' : 'text-amber-600';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">{formattedDate}</h2>
              <div className={`text-lg ${profitColor} font-bold`}>
                Net P&L ${stats.profit.toFixed(2)}
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

          {/* Sección superior: Gráfico y estadísticas uno al lado del otro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Gráfico de P&L Intradía */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium mb-2 text-gray-800">Intraday Cumulative Net P&L</h3>
              <IntraDayPLChart 
                trades={trades}
                totalProfit={stats.profit}
              />
            </div>

            {/* Información general de trading del día */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Total trades</div>
                <div className="text-lg font-bold text-gray-900">{stats.trades}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Winners</div>
                <div className="text-lg font-bold text-green-600">{stats.winningTrades}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Gross P&L</div>
                <div className={`text-lg font-bold ${profitColor}`}>${stats.profit.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Winrate</div>
                <div className={`text-lg font-bold ${winRateColor}`}>{stats.winRate.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Losers</div>
                <div className="text-lg font-bold text-red-600">{stats.losingTrades}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-100">
                <div className="text-xs text-gray-700 font-medium mb-1">Volume</div>
                <div className="text-lg font-bold text-blue-600">{trades.length}</div>
              </div>
            </div>
          </div>

          {/* Tabla de operaciones */}
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Ticker</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Side</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Instrument</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase tracking-wider">Net P&L</th>
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
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-black">{trade.type || (profit >= 0 ? 'LONG' : 'SHORT')}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-black">{trade.symbol || 'Unknown'}</td>
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
              Close
            </button>
            <button 
              onClick={() => {
                // Implementar lógica para ver más detalles si es necesario
                console.log('Ver más detalles de', formattedDate);
              }}
              className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">{format(currentCalendarDate, 'MMMM yyyy')}</h2>
          <button 
            className="px-4 py-2 text-sm bg-blue-50 rounded-full hover:bg-blue-100 transition-colors duration-200 text-blue-600 font-medium flex items-center"
            onClick={goToCurrentMonth}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Today
          </button>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-sm flex items-center">
            <span className="mr-2 text-gray-700">Monthly P&L:</span> 
            <span className={`font-bold text-lg ${monthlyStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${monthlyStats.totalProfit.toFixed(2)}
            </span>
          </div>
          <div className="text-sm flex items-center">
            <span className="mr-2 text-gray-700">Trading days:</span>
            <span className="font-medium">{monthlyStats.tradingDays}</span>
          </div>
        </div>
      </div>

      

      <div className="mb-4">
        <div className="grid grid-cols-7 border-b pb-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={index} className="text-sm font-semibold text-gray-600 text-center">{day}</div>
          ))}
        </div>
      </div>

      <div className="fc-custom-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          initialDate={new Date()} // Cambio para iniciar en el mes actual
          headerToolbar={{
            left: 'prev',
            center: '',
            right: 'next'
          }}
          dayCellContent={renderDayCell}
          height="auto"
          dayMaxEvents={true}
          firstDay={0}
          fixedWeekCount={false}
          datesSet={handleDatesSet}
          // Personalización de botones
          buttonText={{
            prev: '◀',
            next: '▶',
            today: 'Today'
          }}
        />
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-6 gap-4 mt-6">
        {Array.from(weeklyStats.entries()).map(([weekNum, stats]) => {
          // Determinar estilos según rendimiento
          let cellStyles = {};
          let textColorClass = '';
          
          if (stats.profit > 0) {
            textColorClass = 'text-green-700';
            cellStyles = {
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              borderColor: '#86efac',
            };
          } else if (stats.profit < 0) {
            textColorClass = 'text-red-700';
            cellStyles = {
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderColor: '#fca5a5',
            };
          } else {
            textColorClass = 'text-gray-700';
            cellStyles = {
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              borderColor: '#d1d5db',
            };
          }
          
          return (
            <div 
              key={weekNum} 
              style={cellStyles} 
              className="p-3 rounded-lg shadow-sm border"
            >
              <div className="text-sm font-semibold text-gray-700 mb-1">Week {weekNum}</div>
              <div className={`text-lg font-bold ${textColorClass}`}>
                ${stats.profit.toFixed(2)}
              </div>
              <div className="text-xs text-gray-700 flex items-center justify-between">
                <span>{stats.tradingDays} days</span>
                <span>{stats.trades} trades</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Renderizar el modal */}
      {renderModal()}
    </div>
  );
};

export default TradingCalendar;