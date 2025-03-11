import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { LocalStorageServiceNew as LocalStorageService } from '@/services/LocalStorageServiceNew';
import { TradingDataService, ProcessedMetrics } from '@/services/TradingDataService';
import { subDays } from 'date-fns';

interface UseTradingDataOptions {
  startDate?: Date;
  endDate?: Date;
}

interface UseTradingDataResult {
  loading: boolean;
  error: string | null;
  accountData: any;
  processedData: ProcessedMetrics | null;
  refreshData: () => void;
  setDateRange: (startDate: Date, endDate: Date) => void;
}

export function useTradingData(options?: UseTradingDataOptions): UseTradingDataResult {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [processedData, setProcessedData] = useState<ProcessedMetrics | null>(null);
  
  // Estado para el rango de fechas
  const [startDate, setStartDate] = useState<Date>(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30); // Por defecto, 30 días atrás
    return options?.startDate || start;
  });
  
  const [endDate, setEndDate] = useState<Date>(() => {
    return options?.endDate || new Date(); // Por defecto, hoy
  });
  
  // Función para cambiar el rango de fechas
  const setDateRange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };
  
  // Cargar y procesar datos - usando useCallback para evitar recrear esta función
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setError("Usuario no autenticado");
        return;
      }
      
      // Cargar datos de localStorage
      const lastActive = LocalStorageService.getLastActiveAccount(user.id);
      
      if (!lastActive) {
        setError("No hay cuenta activa");
        return;
      }
      
      setAccountData(lastActive);
      
      // Procesar datos según el rango de fechas
      const processed = TradingDataService.processDataByDateRange(lastActive, startDate, endDate);
      
      if (processed) {
        setProcessedData(processed);
        setError(null);
      } else {
        setError("No se pudieron procesar los datos para el período seleccionado");
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate]);
  
  // Cargar datos al montar el componente o cuando cambie el rango de fechas
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Función para refrescar datos manualmente
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);
  
  return {
    loading,
    error,
    accountData,
    processedData,
    refreshData,
    setDateRange
  };
} 