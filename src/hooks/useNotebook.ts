import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { useTradingData } from '@/contexts/TradingDataContext';
import { toast } from 'react-toastify';

export interface JournalNote {
  id: string;
  trade_date: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  account_number?: string;
}

export interface TradingDayData {
  profit?: number;
  net_profit?: number;
  trades?: number;
  winners?: number;
  losers?: number;
  profit_factor?: number;
  swap?: number;
  status?: string;
}

export function useNotebook() {
  const { session, user } = useAuthContext();
  const { currentAccount, processedData, rawData } = useTradingData();
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<JournalNote | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>("all");

  // Cargar todas las notas
  const loadNotes = useCallback(async () => {
    if (!user?.id) {
      setError('Se requiere un ID de usuario');
      return;
    }
    
    try {
      setLoading(true);
      // No filtramos por cuenta para mostrar todas las notas
      const response = await fetch(`/api/journal-notes?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar notas: ${response.status}`);
      }
      
      const data = await response.json();
      setNotes(data.notes || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando notas:', err);
      setError('Error al cargar notas del notebook');
      toast.error('No se pudieron cargar las notas del notebook');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Función para obtener las notas filtradas según la carpeta seleccionada
  const getFilteredNotes = useCallback(() => {
    if (!notes.length) return [];
    
    if (activeFolder === "all") {
      return notes;
    }
    
    if (activeFolder === "deleted") {
      // En caso de implementar "papelera" en el futuro
      return [];
    }

    if (activeFolder === "trade" || activeFolder === "daily") {
      // En el futuro, se podría filtrar por tags o categorías
      return notes;
    }
    
    // Filtrar por mes/año (si activeFolder es un mes y año)
    return notes.filter(note => {
      try {
        const date = new Date(note.trade_date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        return monthYear === activeFolder;
      } catch (e) {
        return false;
      }
    });
  }, [notes, activeFolder]);

  // Nueva función para obtener datos de trading de un día específico
  const getTradingDayData = useCallback((dateStr: string): TradingDayData | null => {
    // Importante: asegurar que dateStr esté en el formato correcto YYYY-MM-DD
    const formattedDateStr = dateStr.trim();
    console.log("getTradingDayData: Searching for date", formattedDateStr);
    
    // PASO 1: Intentar obtener datos del contexto
    if (processedData?.daily_results) {
      console.log("getTradingDayData: Searching in context data");
      
      if (Object.keys(processedData.daily_results).length > 0) {
        console.log("getTradingDayData: Available dates in context sample:", 
          Object.keys(processedData.daily_results).slice(0, 5), 
          "of", Object.keys(processedData.daily_results).length, "total dates");
      }
      
      // Buscar en los resultados diarios del contexto
      const dayData = processedData.daily_results[formattedDateStr];
      
      if (dayData) {
        console.log("getTradingDayData: Found data in context for date", formattedDateStr, dayData);
        return {
          profit: dayData.profit,
          net_profit: dayData.net_profit !== undefined ? dayData.net_profit : dayData.profit,
          trades: dayData.trades,
          winners: dayData.winners,
          losers: dayData.losers,
          profit_factor: dayData.profit_factor,
          swap: dayData.swap,
          status: dayData.status
        };
      }
    } else {
      console.log("getTradingDayData: No daily_results available in context");
    }
    
    // PASO 2: Si no se encuentra en el contexto, intentar obtener datos directamente del localStorage
    console.log("getTradingDayData: Trying to fetch data from localStorage");
    try {
      // Buscar el currentAccount actual para intentar recuperar datos
      const account = currentAccount || 'default';
      
      // Estructura de datos esperada en localStorage
      const storageKey = `trading_data_${account}`;
      const storageData = localStorage.getItem(storageKey);
      
      if (storageData) {
        const parsedData = JSON.parse(storageData);
        
        if (parsedData.processedData?.daily_results) {
          const storageDayData = parsedData.processedData.daily_results[formattedDateStr];
          
          if (storageDayData) {
            console.log("getTradingDayData: Found data in localStorage for date", formattedDateStr, storageDayData);
            return {
              profit: storageDayData.profit,
              net_profit: storageDayData.net_profit !== undefined ? storageDayData.net_profit : storageDayData.profit,
              trades: storageDayData.trades,
              winners: storageDayData.winners,
              losers: storageDayData.losers,
              profit_factor: storageDayData.profit_factor,
              swap: storageDayData.swap,
              status: storageDayData.status
            };
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data from localStorage:", error);
    }
    
    // Si no se encuentra ni en el contexto ni en localStorage
    console.log("getTradingDayData: No data found for date", formattedDateStr);
    return null;
  }, [processedData, currentAccount]);

  // Función similar para getDayTrades pero con respaldo en localStorage
  const getDayTrades = useCallback((dateStr: string): any[] => {
    // PASO 1: Intentar obtener datos del contexto
    if (rawData?.history && Array.isArray(rawData.history)) {
      console.log("getDayTrades: Searching in context data");
      
      // Filtrar trades de este día
      const dayTrades = rawData.history.filter((trade: any) => {
        if (!trade.time) return false;
        
        // Convertir timestamp a fecha
        let tradeDate;
        if (typeof trade.time === 'number') {
          tradeDate = new Date(trade.time * 1000);
        } else {
          tradeDate = new Date(trade.time);
        }
        
        // Comparar fecha en formato YYYY-MM-DD
        const tradeDateStr = tradeDate.toISOString().split('T')[0];
        return tradeDateStr === dateStr;
      });
      
      if (dayTrades.length > 0) {
        console.log("getDayTrades: Found", dayTrades.length, "trades in context for date", dateStr);
        return dayTrades;
      }
    }
    
    // PASO 2: Si no se encuentra en el contexto, intentar obtener datos directamente del localStorage
    console.log("getDayTrades: Trying to fetch trades from localStorage");
    try {
      // Buscar el currentAccount actual para intentar recuperar datos
      const account = currentAccount || 'default';
      
      // Estructura de datos esperada en localStorage
      const storageKey = `trading_data_${account}`;
      const storageData = localStorage.getItem(storageKey);
      
      if (storageData) {
        const parsedData = JSON.parse(storageData);
        
        if (parsedData.rawData?.history && Array.isArray(parsedData.rawData.history)) {
          const storageTrades = parsedData.rawData.history.filter((trade: any) => {
            if (!trade.time) return false;
            
            // Convertir timestamp a fecha
            let tradeDate;
            if (typeof trade.time === 'number') {
              tradeDate = new Date(trade.time * 1000);
            } else {
              tradeDate = new Date(trade.time);
            }
            
            // Comparar fecha en formato YYYY-MM-DD
            const tradeDateStr = tradeDate.toISOString().split('T')[0];
            return tradeDateStr === dateStr;
          });
          
          if (storageTrades.length > 0) {
            console.log("getDayTrades: Found", storageTrades.length, "trades in localStorage for date", dateStr);
            return storageTrades;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching trades from localStorage:", error);
    }
    
    console.log("getDayTrades: No trades found for date", dateStr);
    return [];
  }, [rawData, currentAccount]);
  
  // Guardar una nota
  const saveNote = async (noteData: {
    id?: string;
    title: string;
    content: string;
    tradeDate: string;
  }) => {
    if (!user?.id) {
      toast.error('No se ha iniciado sesión');
      return null;
    }
    
    try {
      setLoading(true);
      
      if (noteData.id) {
        // Actualizar nota existente
        const response = await fetch('/api/journal-notes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: noteData.id,
            title: noteData.title,
            content: noteData.content,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error al actualizar nota: ${response.status}`);
        }
        
        const result = await response.json();
        toast.success('Nota actualizada exitosamente');
        await loadNotes();
        return result.note;
      } else {
        // Crear nueva nota
        const response = await fetch('/api/journal-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            tradeDate: noteData.tradeDate,
            accountNumber: currentAccount,
            title: noteData.title,
            content: noteData.content,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error al crear nota: ${response.status}`);
        }
        
        const result = await response.json();
        toast.success('Nota guardada exitosamente');
        await loadNotes();
        return result.note;
      }
    } catch (err) {
      console.error('Error guardando nota:', err);
      toast.error('Error al guardar la nota');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar una nota
  const deleteNote = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
      return false;
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
      
      // Si la nota eliminada era la seleccionada, desseleccionarla
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      
      await loadNotes();
      return true;
    } catch (err) {
      console.error('Error eliminando nota:', err);
      toast.error('Error al eliminar la nota');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Nueva función: Crear una nota rápida para el día actual
  const createQuickNote = async (title: string = '', content: string = '') => {
    if (!user?.id) {
      toast.error('No se ha iniciado sesión');
      return null;
    }

    try {
      // Usar fecha actual en formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      return await saveNote({
        title: title || `Nota del ${new Date().toLocaleDateString()}`,
        content: content || '',
        tradeDate: today
      });
    } catch (err) {
      console.error('Error creando nota rápida:', err);
      toast.error('Error al crear nota rápida');
      return null;
    }
  };
  
  // Cargar notas al inicio
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);
  
  // Función explícita para seleccionar una nota - VERSIÓN MEJORADA Y SIMPLIFICADA
  const selectNote = useCallback((note: JournalNote) => {
    if (!note) {
      console.log("selectNote: No se proporcionó una nota válida");
      return;
    }
    
    console.log("selectNote: Cambiando a nota:", note.id, note.title, note.trade_date);
    
    // Crear copia limpia para evitar referencias circulares o propiedades inesperadas
    const cleanedNote = {
      id: note.id,
      trade_date: note.trade_date,
      title: note.title,
      content: note.content,
      created_at: note.created_at,
      updated_at: note.updated_at,
      account_number: note.account_number
    };
    
    // Establecer la nota seleccionada
    setSelectedNote(cleanedNote);
    
    // Iniciar carga de datos de trading (sin esperar resultado)
    if (cleanedNote.trade_date) {
      const dayData = getTradingDayData(cleanedNote.trade_date);
      console.log("selectNote: Datos de trading:", 
        cleanedNote.trade_date, 
        dayData ? "disponibles" : "no disponibles"
      );
    }
  }, [getTradingDayData]);
  
  // Seleccionar automáticamente la primera nota cuando se cargan inicialmente
  useEffect(() => {
    console.log("useNotebook effect:", { 
      notesLength: notes.length, 
      hasSelectedNote: !!selectedNote,
      selectedNoteId: selectedNote?.id 
    });
    
    if (notes.length > 0 && !selectedNote) {
      console.log("Setting first note:", notes[0].id, notes[0].title);
      // Importante: hacemos una pequeña pausa para asegurar que todos los componentes estén listos
      setTimeout(() => {
        selectNote(notes[0]);
      }, 100);
    }
  }, [notes, selectedNote, selectNote]);
  
  return {
    notes,
    filteredNotes: getFilteredNotes(),
    selectedNote,
    setSelectedNote: selectNote,
    loading,
    error,
    loadNotes,
    saveNote,
    deleteNote,
    activeFolder,
    setActiveFolder,
    // Nuevas funciones para datos de trading
    getTradingDayData,
    getDayTrades,
    createQuickNote
  };
} 