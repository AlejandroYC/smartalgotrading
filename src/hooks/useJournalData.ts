import { useState, useEffect } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';

export interface JournalData {
  daily_results: Record<string, any>;
  history: any[];
  rawData: any;
  isLoading: boolean;
}

export const useJournalData = () => {
  const { currentAccount, refreshData, dateRange, isDateInRange } = useTradingData();
  const [journalData, setJournalData] = useState<JournalData>({
    daily_results: {},
    history: [],
    rawData: null,
    isLoading: true
  });

  // Función para obtener el rango de fechas actual (desde localStorage o contexto)
  const getCurrentDateRange = () => {
    try {
      // Intentar obtener desde localStorage primero
      const savedRange = localStorage.getItem("smartalgo_current_date_range");
      if (savedRange) {
        const parsedRange = JSON.parse(savedRange);
        return {
          startDate: new Date(parsedRange.startDate),
          endDate: new Date(parsedRange.endDate),
          label: parsedRange.label
        };
      }
    } catch (error) {
      console.error("Error recuperando rango de fechas:", error);
    }
    
    // Si no hay en localStorage o hay error, usar el del contexto
    return dateRange;
  };

  // Función para filtrar datos por rango de fechas
  const filterDataByDateRange = (data: any) => {
    if (!data) return null;
    
    const currentRange = getCurrentDateRange();
    
    // Filtrar daily_results
    const filteredDailyResults: Record<string, any> = {};
    
    if (data.statistics?.daily_results) {
      Object.keys(data.statistics.daily_results).forEach(dateStr => {
        if (isDateInRange(dateStr, currentRange)) {
          filteredDailyResults[dateStr] = data.statistics.daily_results[dateStr];
        }
      });
    }
    
    // Filtrar historial de operaciones
    const filteredHistory = data.history ? data.history.filter((trade: any) => {
      try {
        // Convertir timestamp a fecha
        let tradeDate: Date;
        if (typeof trade.time === 'number') {
          tradeDate = new Date(trade.time > 10000000000 ? trade.time : trade.time * 1000);
        } else {
          tradeDate = new Date(trade.time);
        }
        
        // Crear fecha sin hora para comparación
        const tradeDateWithoutTime = new Date(
          tradeDate.getFullYear(),
          tradeDate.getMonth(),
          tradeDate.getDate()
        );
        
        // Comparar con rango
        return (
          tradeDateWithoutTime >= currentRange.startDate &&
          tradeDateWithoutTime <= currentRange.endDate
        );
      } catch (error) {
        console.error("Error filtrando operación por fecha:", error);
        return false;
      }
    }) : [];
    
    return {
      daily_results: filteredDailyResults,
      history: filteredHistory,
      rawData: data
    };
  };

  // Función para cargar datos directamente desde la API
  const loadFromAPI = async (accountNumber: string) => {
    try {
      setJournalData(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch(`/api/journal-data?accountNumber=${accountNumber}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Normalizar los datos
        const parsedData = result.data;
        
        // Guardar en localStorage para futuros accesos
        const storageKey = `smartalgo_${accountNumber}_account_data`;
        localStorage.setItem(storageKey, JSON.stringify(parsedData));
        
        // Filtrar por rango de fechas y actualizar el estado
        const filteredData = filterDataByDateRange(parsedData);
        
        setJournalData({
          daily_results: filteredData?.daily_results || {},
          history: filteredData?.history || [],
          rawData: parsedData,
          isLoading: false
        });
        
        console.log("Datos del diario cargados desde API", {
          cuenta: accountNumber,
          cantidadDias: Object.keys(filteredData?.daily_results || {}).length,
          cantidadOperaciones: filteredData?.history?.length || 0,
          rangoFechas: getCurrentDateRange().label || "personalizado"
        });
        
        return true;
      } else {
        throw new Error(result.message || 'Error desconocido al cargar datos');
      }
    } catch (error) {
      console.error("Error cargando datos desde API:", error);
      setJournalData(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  useEffect(() => {
    const loadDataFromLocalStorage = async () => {
      if (!currentAccount) {
        setJournalData(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      setJournalData(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Intentar cargar datos directamente de localStorage
        const storageKey = `smartalgo_${currentAccount}_account_data`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          
          // Verificar que los datos tengan la estructura esperada
          if (parsedData.history && parsedData.statistics) {
            // Filtrar por rango de fechas
            const filteredData = filterDataByDateRange(parsedData);
            
            setJournalData({
              daily_results: filteredData?.daily_results || {},
              history: filteredData?.history || [],
              rawData: parsedData,
              isLoading: false
            });
            
            console.log("Datos del diario cargados desde localStorage", {
              cuenta: currentAccount,
              cantidadDias: Object.keys(filteredData?.daily_results || {}).length,
              cantidadOperaciones: filteredData?.history?.length || 0,
              rangoFechas: getCurrentDateRange().label || "personalizado"
            });
            
            // Si los datos son muy antiguos (>30 minutos), intentar actualizarlos en segundo plano
            const lastUpdated = parsedData.lastUpdated ? new Date(parsedData.lastUpdated) : null;
            const now = new Date();
            const thirtyMinutesInMs = 30 * 60 * 1000;
            
            if (!lastUpdated || (now.getTime() - lastUpdated.getTime() > thirtyMinutesInMs)) {
              console.log("Datos antiguos, actualizando en segundo plano...");
              loadFromAPI(currentAccount).catch(console.error);
            }
            
            return;
          } else {
            console.log("Datos en localStorage no válidos, cargando desde API", currentAccount);
          }
        } else {
          console.log("No se encontraron datos en localStorage para la cuenta", currentAccount);
        }
        
        // Si no hay datos válidos en localStorage o no existen, intentar cargar desde API
        const apiSuccess = await loadFromAPI(currentAccount);
        
        // Si la API falla, intentar el método del contexto como última opción
        if (!apiSuccess) {
          console.log("Recarga desde API falló, usando refreshData del contexto");
          refreshData();
        }
      } catch (error) {
        console.error("Error cargando datos del diario:", error);
        setJournalData(prev => ({ ...prev, isLoading: false }));
        // Intentar refrescar datos desde la API del contexto
        refreshData();
      }
    };

    // Cargar datos inmediatamente
    loadDataFromLocalStorage();
    
    // También escuchar cambios en localStorage (por si se actualizan desde otra parte)
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key && 
        (event.key.includes(`smartalgo_${currentAccount}`) || 
         event.key === "smartalgo_current_date_range")
      ) {
        console.log("Detectado cambio en localStorage, recargando datos del diario");
        loadDataFromLocalStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentAccount, refreshData, dateRange]);

  // Función para forzar una recarga de datos
  const reloadData = async () => {
    if (!currentAccount) return;
    
    // Intentar cargar directamente de la API primero
    setJournalData(prev => ({ ...prev, isLoading: true }));
    
    try {
      const success = await loadFromAPI(currentAccount);
      
      // Si la API falla, usar el refreshData del contexto
      if (!success) {
        refreshData();
      }
    } catch (error) {
      console.error("Error recargando datos:", error);
      // Usar el método del contexto como fallback
      refreshData();
    }
  };

  return {
    ...journalData,
    reloadData,
    dateRange: getCurrentDateRange()
  };
}; 