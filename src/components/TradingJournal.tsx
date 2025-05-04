'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isAfter, isBefore, isEqual } from 'date-fns';
import { useTradingData } from '@/contexts/TradingDataContext';
import { useJournalData } from '@/hooks/useJournalData';
import { toast } from 'react-toastify';
import AccountSelector from './AccountSelector';
import { LoadingIndicator } from './LoadingIndicator';
import { es } from 'date-fns/locale';
import IntraDayPLChart from './IntraDayPLChart';

// Interfaz para las notas de diario
interface JournalNote {
  id: string;
  trade_date: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

// Interfaz para las propiedades del componente
interface TradingJournalProps {
  userId: string;
  accountNumber: string;
}

// Interfaz para el rango de fechas
interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

const TradingJournal: React.FC<TradingJournalProps> = ({ userId, accountNumber }) => {
  // Estado para las notas
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para la nota actual que se está editando
  const [currentNote, setCurrentNote] = useState<JournalNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // Estados para la UI
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para el calendario
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  
  // Obtener datos de trading del contexto
  const { currentAccount, selectAccount, userAccounts } = useTradingData();
  
  // Usar el nuevo hook de datos del diario que carga desde localStorage
  const { daily_results, history, rawData, isLoading, reloadData } = useJournalData();
  
  // Actualizar el estado de carga combinando ambas fuentes
  useEffect(() => {
    setLoading(loading || isLoading);
  }, [loading, isLoading]);
  
  // Función para cargar las notas
  const loadNotes = useCallback(async () => {
    if (!userId) {
      setError('Se requiere un ID de usuario');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/journal-notes?userId=${userId}${currentAccount ? `&accountNumber=${currentAccount}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar notas: ${response.status}`);
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando notas:', err);
      setError('Error al cargar notas de diario');
      toast.error('No se pudieron cargar las notas del diario');
    } finally {
      setLoading(false);
    }
  }, [userId, currentAccount]);
  
  // Cargar notas al inicio o cuando cambie el usuario o cuenta
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);
  
  // Función para guardar una nota
  const saveNote = async () => {
    if (!userId || !selectedDate) {
      toast.error('Información incompleta para guardar la nota');
      return;
    }
    
    try {
      setLoading(true);
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      if (currentNote) {
        // Actualizar nota existente
        const response = await fetch('/api/journal-notes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentNote.id,
            title: noteTitle,
            content: noteContent,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error al actualizar nota: ${response.status}`);
        }
        
        toast.success('Nota actualizada exitosamente');
      } else {
        // Crear nueva nota
        const response = await fetch('/api/journal-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tradeDate: formattedDate,
            accountNumber: currentAccount,
            title: noteTitle,
            content: noteContent,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error al crear nota: ${response.status}`);
        }
        
        toast.success('Nota guardada exitosamente');
      }
      
      // Recargar notas y limpiar formulario
      await loadNotes();
      clearForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando nota:', err);
      toast.error('Error al guardar la nota');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para eliminar una nota
  const deleteNote = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/journal-notes?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar nota: ${response.status}`);
      }
      
      toast.success('Nota eliminada exitosamente');
      await loadNotes();
    } catch (err) {
      console.error('Error eliminando nota:', err);
      toast.error('Error al eliminar la nota');
    } finally {
      setLoading(false);
    }
  };
  
  // Limpiar formulario
  const clearForm = () => {
    setCurrentNote(null);
    setNoteContent('');
    setNoteTitle('');
  };
  
  // Abrir modal para editar una nota existente
  const openEditModal = (note: JournalNote) => {
    setCurrentNote(note);
    setNoteContent(note.content);
    setNoteTitle(note.title || '');
    setSelectedDate(parseISO(note.trade_date));
    setIsModalOpen(true);
  };
  
  // Abrir modal para crear una nueva nota
  const openNewNoteModal = (date: Date) => {
    clearForm();
    setSelectedDate(date);
    setIsModalOpen(true);
  };
  
  // Expandir o colapsar un día
  const toggleDayExpansion = (dateStr: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };
  
  // Obtener las fechas con operaciones de trading del localStorage usando el nuevo hook
  const getTradingDays = useCallback(() => {
    // Si no hay datos, retornar un array vacío
    if (!daily_results || Object.keys(daily_results).length === 0) {
      return [];
    }
    
    return Object.keys(daily_results)
      .map(dateStr => {
        const dayData = daily_results[dateStr];
        return {
          date: dateStr,
          profit: typeof dayData.profit === 'string' ? parseFloat(dayData.profit) : dayData.profit,
          trades: dayData.trades || 0,
          winners: dayData.winners || 0,
          losers: dayData.losers || 0,
          winRate: dayData.trades > 0 ? ((dayData.winners || 0) / dayData.trades) * 100 : 0,
          commissions: dayData.commissions || 0,
          volume: dayData.volume || 0,
          profitFactor: dayData.profit_factor || '--'
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Ordenar por fecha descendente
  }, [daily_results]);

  // Calcular días de trading usando el callback
  const tradingDays = getTradingDays();
  
  // Filtrar días de trading basados en la selección del rango del calendario
  const filteredTradingDays = selectedDateRange.startDate 
    ? tradingDays.filter(day => {
        const dayDate = parseISO(day.date);
        if (selectedDateRange.startDate && !selectedDateRange.endDate) {
          // Si solo se seleccionó la fecha inicial, mostrar solo ese día
          return day.date === selectedDateRange.startDate;
        } else if (selectedDateRange.startDate && selectedDateRange.endDate) {
          // Si se seleccionó un rango, mostrar todos los días en ese rango
          const startDate = parseISO(selectedDateRange.startDate);
          const endDate = parseISO(selectedDateRange.endDate);
          return (
            (isAfter(dayDate, startDate) || isEqual(dayDate, startDate)) && 
            (isBefore(dayDate, endDate) || isEqual(dayDate, endDate))
          );
        }
        return false;
      })
    : tradingDays;
  
  // Función para obtener las fechas que tienen datos de trading
  const tradingDatesSet = new Set(tradingDays.map(day => day.date));
  
  // Funciones para el calendario
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Función para manejar clics en el calendario
  const onDateClick = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    console.log('Clicked on date:', formattedDate);
    
    if (tradingDatesSet.has(formattedDate)) {
      // Si no hay fecha inicial o hay un rango completo, establecer nueva fecha inicial
      if (!selectedDateRange.startDate || (selectedDateRange.startDate && selectedDateRange.endDate)) {
        setSelectedDateRange({
          startDate: formattedDate,
          endDate: null
        });
        console.log('Setting start date:', formattedDate);
      } 
      // Si hay fecha inicial pero no final y la fecha seleccionada es después de la inicial
      else if (selectedDateRange.startDate && !selectedDateRange.endDate) {
        const startDate = parseISO(selectedDateRange.startDate);
        
        // Si la fecha seleccionada es anterior a la fecha inicial, intercambiar
        if (isBefore(day, startDate)) {
          setSelectedDateRange({
            startDate: formattedDate,
            endDate: selectedDateRange.startDate
          });
          console.log('Setting reversed range:', formattedDate, 'to', selectedDateRange.startDate);
        } 
        // Si es la misma fecha, eliminar la selección
        else if (isEqual(day, startDate)) {
          setSelectedDateRange({
            startDate: null,
            endDate: null
          });
          console.log('Clearing date range');
        } 
        // De lo contrario, establecer como fecha final
        else {
          setSelectedDateRange({
            ...selectedDateRange,
            endDate: formattedDate
          });
          console.log('Setting end date:', formattedDate);
        }
      }
    }
  };

  // Obtener las operaciones para un día específico
  const getTradesForDay = useCallback((dateStr: string) => {
    if (!history || history.length === 0) return [];
    
    return history.filter((trade: any) => {
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
  }, [history]);
  
  // Mostrar las notas por fecha
  const getNoteForDay = (dateStr: string): JournalNote | undefined => {
    return notes.find(note => note.trade_date === dateStr);
  };

  // Formatear hora de operación
  const formatTradeTime = (time: any) => {
    try {
      let tradeTime: Date;
      if (typeof time === 'number') {
        tradeTime = new Date(time > 10000000000 ? time : time * 1000);
      } else {
        tradeTime = new Date(time);
      }
      return tradeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
      console.error("Error formateando hora:", error);
      return "00:00:00";
    }
  };

  // Formatear tipo de operación
  const formatTradeType = (type: number) => {
    const types: Record<number, string> = {
      0: 'BUY',
      1: 'SELL',
      2: 'BUY LIMIT',
      3: 'SELL LIMIT',
      4: 'BUY STOP',
      5: 'SELL STOP',
      6: 'BALANCE'
    };
    return types[type] || 'UNKNOWN';
  };

  // Convertir el arreglo de userAccounts al formato esperado por AccountSelector
  const formattedAccounts = userAccounts.map(acc => ({
    account_number: acc.account_number,
    is_active: true,
  }));

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      {/* Header con título */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black">Detalle de Operaciones</h2>
      </div>
      
      {loading && <LoadingIndicator />}
      
      <div className="flex mb-6 text-black">
        <button 
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md mr-2"
          onClick={() => {
            const allExpanded = Object.keys(expandedDays).every(key => expandedDays[key]);
            if (allExpanded) {
              setExpandedDays({});
            } else {
              const newExpandedState: Record<string, boolean> = {};
              filteredTradingDays.forEach(day => {
                newExpandedState[day.date] = true;
              });
              setExpandedDays(newExpandedState);
            }
          }}
        >
          {Object.keys(expandedDays).length === filteredTradingDays.length ? "Collapse all" : "Expand all"}
        </button>
        {(selectedDateRange.startDate) && (
          <button 
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md flex items-center"
            onClick={() => setSelectedDateRange({ startDate: null, endDate: null })}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filter {selectedDateRange.endDate && `(${format(parseISO(selectedDateRange.startDate!), 'dd/MM')} - ${format(parseISO(selectedDateRange.endDate), 'dd/MM')})`}
          </button>
        )}
      </div>
      
      {/* Layout de dos columnas: datos de trading y calendario */}
      <div className="flex flex-col lg:flex-row gap-6 text-black">
        {/* Columna izquierda: Lista de días de trading con sus notas */}
        <div className="lg:w-3/4">
          <div className="space-y-4">
            {filteredTradingDays.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {selectedDateRange.startDate 
                  ? `No hay datos de trading disponibles para el rango seleccionado.`
                  : `No hay datos de trading disponibles. Por favor selecciona una cuenta con historial de operaciones.`
                }
              </div>
            ) : (
              filteredTradingDays.map(day => {
                const note = getNoteForDay(day.date);
                const date = parseISO(day.date);
                const isExpanded = !!expandedDays[day.date];
                const dayTrades = getTradesForDay(day.date);
                
                return (
                  <div 
                    key={day.date} 
                    className="border rounded-lg overflow-hidden shadow-sm text-black"
                  >
                    {/* Encabezado del día - siempre visible */}
                    <div 
                      onClick={() => toggleDayExpansion(day.date)}
                      className="flex justify-between items-center p-4 cursor-pointer bg-white hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="mr-2">
                          {isExpanded ? (
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                        <h3 className="text-lg font-medium">
                          {format(date, 'EEE, MMM d, yyyy', { locale: es })}
                        </h3>
                        {note && (
                          <div className="ml-2 bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Nota
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className={`mr-4 font-medium ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Net P&L {day.profit >= 0 ? '$' : '-$'}{Math.abs(day.profit).toFixed(2)}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            note ? openEditModal(note) : openNewNoteModal(date);
                          }}
                          className={`py-2 px-4 text-sm rounded-md flex items-center ${
                            note 
                              ? 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100' 
                              : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          {note ? 'Ver nota' : 'Agregar nota'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Gráfico y estadísticas - siempre visible (contraído o expandido) */}
                    <div className="border-t border-gray-200 p-4 bg-white text-black">
                      {/* Layout con gráfico a la izquierda y stats a la derecha */}
                      <div className="flex flex-col lg:flex-row">
                        {/* Gráfico de P&L del día - ocupa el 50% a la izquierda */}
                        <div className="lg:w-1/2 mb-6 lg:mb-0 lg:pr-4">
                          <IntraDayPLChart 
                            trades={dayTrades}
                            totalProfit={day.profit}
                          />
                          <div className="text-xs text-gray-500 text-center mt-1">
                            Intraday cumulative net P&L
                          </div>
                        </div>

                        {/* Estadísticas - dos columnas verticales a la derecha */}
                        <div className="lg:w-1/2 grid grid-cols-2 lg:grid-cols-2 gap-0 text-black">
                          <div className="flex flex-col">
                            <div className="border-b border-r border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Total trades</div>
                              <div className="text-xl font-medium">{day.trades}</div>
                            </div>
                            <div className="border-b border-r border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Winrate</div>
                              <div className="text-xl font-medium">{day.winRate.toFixed(1)}%</div>
                            </div>
                            <div className="border-b border-r border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Losers</div>
                              <div className="text-xl font-medium">{day.losers}</div>
                            </div>
                            <div className="border-r border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Volume</div>
                              <div className="text-xl font-medium">{day.volume.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <div className="border-b border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Winners</div>
                              <div className="text-xl font-medium">{day.winners}</div>
                            </div>
                            <div className="border-b border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Gross P&L</div>
                              <div className={`text-xl font-medium ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${day.profit.toFixed(2)}
                              </div>
                            </div>
                            <div className="border-b border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Commissions</div>
                              <div className="text-xl font-medium">${day.commissions.toFixed(2)}</div>
                            </div>
                            <div className="border-gray-200 py-3 px-4">
                              <div className="text-sm text-gray-900">Profit factor</div>
                              <div className="text-xl font-medium">{day.profitFactor}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenido expandible del día - solo tabla de operaciones */}
                    {isExpanded && dayTrades.length > 0 && (
                      <div className="border-t border-gray-200 bg-white text-black">
                        {/* Tabla de operaciones */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open time</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrument</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net P&L</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net ROI</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Realized R-Multiple</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Playbook</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {dayTrades.map((trade: any, index: number) => {
                                const profit = typeof trade.profit === 'number' ? trade.profit : parseFloat(trade.profit || '0');
                                return (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {formatTradeTime(trade.time)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      <div className="bg-gray-100 rounded-full px-3 py-1 inline-flex">
                                        {trade.symbol || 'SFX'}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {formatTradeType(trade.type)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {trade.symbol || 'SFX'}
                                    </td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ${profit.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {(trade.roi || 0.0).toFixed(2)}%
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {trade.r_multiple ? `${trade.r_multiple.toFixed(2)}R` : '--'}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      --
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                      <button className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mostrar la nota si existe */}
                        {note && (
                          <div className="mt-4 p-4 mx-4 mb-4 bg-gray-50 rounded-md">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{note.title || 'Note'}</h4>
                              <button 
                                onClick={() => deleteNote(note.id)}
                                className="text-red-600 text-sm hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                            <p className="text-gray-700 whitespace-pre-line">{note.content}</p>
                            <div className="text-xs text-gray-500 mt-2">
                              Updated: {format(new Date(note.updated_at), 'dd/MM/yyyy HH:mm')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Columna derecha: Calendario */}
        <div className="lg:w-1/4">
          <div className="border rounded-lg shadow-sm p-4 lg:sticky lg:top-4">
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-medium">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
            
            <div className="mt-4 flex flex-col space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></div>
                  <span>Trading con ganancias</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 border border-red-400 rounded-sm mr-1"></div>
                  <span>Trading con pérdidas</span>
                </div>
              </div>
              
              <div className="text-center pt-2 border-t border-gray-200 mt-2">
                {selectedDateRange.startDate && !selectedDateRange.endDate ? (
                  <span>Selecciona la fecha final del rango</span>
                ) : !selectedDateRange.startDate ? (
                  <span>Selecciona la fecha inicial del rango</span>
                ) : (
                  <span>Rango: {format(parseISO(selectedDateRange.startDate), 'dd/MM')} - {format(parseISO(selectedDateRange.endDate!), 'dd/MM')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal para agregar/editar nota */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-black">
              {currentNote ? 'Editar nota' : 'Nueva nota'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Fecha
              </label>
              <div className="text-gray-900">
                {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es }) : 'No hay fecha seleccionada'}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="noteTitle" className="block text-gray-700 text-sm font-medium mb-1">
                Titulo (opcional)
              </label>
              <input
                type="text"
                id="noteTitle"
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Título de la nota"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="noteContent" className="block text-gray-700 text-sm font-medium mb-1">
                Contenido
              </label>
              <textarea
                id="noteContent"
                className="w-full p-2 border border-gray-300 rounded-md h-40 text-black"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escribe tu nota aquí..."
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={saveNote}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Función para renderizar el calendario
  function renderCalendar() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const dateFormat = 'd';
    const rows = [];
    
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, 'yyyy-MM-dd');
        const hasTradingData = tradingDatesSet.has(formattedDate);
        const dayProfit = hasTradingData 
          ? tradingDays.find(d => d.date === formattedDate)?.profit || 0
          : 0;
        
        // Verificar si el día está en el rango seleccionado
        let inRange = false;
        let isRangeStart = false;
        let isRangeEnd = false;
        
        if (selectedDateRange.startDate && selectedDateRange.endDate) {
          const rangeStart = parseISO(selectedDateRange.startDate);
          const rangeEnd = parseISO(selectedDateRange.endDate);
          
          isRangeStart = formattedDate === selectedDateRange.startDate;
          isRangeEnd = formattedDate === selectedDateRange.endDate;
          
          inRange = (
            (isAfter(day, rangeStart) || isEqual(day, rangeStart)) && 
            (isBefore(day, rangeEnd) || isEqual(day, rangeEnd))
          );
        } else if (selectedDateRange.startDate && !selectedDateRange.endDate) {
          isRangeStart = formattedDate === selectedDateRange.startDate;
          inRange = isRangeStart;
        }
        
        days.push(
          <div
            key={formattedDate}
            className={`
              p-2 text-center text-sm rounded-sm
              ${!isSameMonth(day, monthStart) ? 'text-gray-300' : 'text-gray-900'}
              ${hasTradingData && dayProfit >= 0 ? 'bg-green-100 border border-green-400' : ''}
              ${hasTradingData && dayProfit < 0 ? 'bg-red-100 border border-red-400' : ''}
              ${isRangeStart ? 'ring-2 ring-blue-600 ring-offset-1 font-bold' : ''}
              ${isRangeEnd ? 'ring-2 ring-blue-600 ring-offset-1 font-bold' : ''}
              ${inRange && !isRangeStart && !isRangeEnd ? 'bg-blue-50 border border-blue-300' : ''}
              ${hasTradingData ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}
            `}
            onClick={() => hasTradingData && onDateClick(cloneDay)}
          >
            {format(day, dateFormat)}
          </div>
        );
        day = addDays(day, 1);
      }
      
      rows.push(
        <React.Fragment key={format(day, 'yyyy-MM-dd')}>
          {days}
        </React.Fragment>
      );
      days = [];
    }
    
    return rows;
  }
};

export default TradingJournal; 