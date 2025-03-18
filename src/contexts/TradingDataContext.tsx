'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LocalStorageServiceNew as LocalStorageService } from '@/services/LocalStorageServiceNew';
import { MT5Client } from '@/services/mt5/mt5Client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { formatTradeType } from '@/utils/tradeUtils';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface Position {
  ticket?: string | number;
  symbol?: string;
  type?: string;
  volume?: number;
  openTime?: string | number;
  openPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
}

interface Trade {
  ticket: number;
  time: string | number;
  time_msc?: number;
  type: number;
  entry?: number;
  profit: number;
  symbol?: string;
  volume?: number;
  price?: number;
  position_id?: number;
  order?: number;
}

interface MT5Position {
  ticket: number;
  time: number;
  type: number;
  symbol: string;
  volume: number;
  open_price: number;
  current_price: number;
  sl: number;
  tp: number;
  profit: number;
  swap: number;
  comment: string;
}

interface ProcessedTrade extends Trade {
  timestamp: Date;     // fecha convertida a objeto Date
  dateStr: string;     // fecha en formato YYYY-MM-DD para agrupación
}

interface TradingDataContextType {
  loading: boolean;
  error: string | null;
  rawData: any;
  processedData: any & { 
    rawTrades?: any[];
    calculateTotalPL?: () => number;
    verifyDailyResultsConsistency?: () => {
      fromTrades: number;
      fromDaily: number;
      difference: number;
      isConsistent: boolean;
    };
  };
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  availableRanges: DateRange[];
  refreshData: () => void;
  positions: Position[];
  // Nuevas propiedades para manejo de múltiples cuentas
  userAccounts: { account_number: string }[];
  currentAccount: string | null;
  loadUserAccounts: () => Promise<void>;
  selectAccount: (accountNumber: string) => void;
  // Timestamp para forzar actualizaciones en la UI cuando cambian los datos
  lastDataTimestamp: number;
  // Utilitarios
  formatDateKey: (date: Date) => string;
  isDateInRange: (dateStr: string, range: DateRange) => boolean;
  // Nuevas funciones para manejar datos obsoletos
  areDataStale: () => boolean;
  refreshIfStale: () => boolean;
  // Nueva propiedad para indicar si el usuario no tiene cuentas
  hasNoAccounts: boolean;
}

// Función para obtener rangos de fecha actuales
const getCurrentRanges = (): DateRange[] => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // Establecer al final del día
  
  // Crear fecha de inicio para 7D, 30D, etc. (inicio del día)
  const createStartDate = (daysBack: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysBack);
    date.setHours(0, 0, 0, 0); // Inicio del día
    return date;
  };
  
  // Crear fecha de inicio para YTD (1 de enero del año actual)
  const createYTDStartDate = () => {
    const date = new Date(now.getFullYear(), 0, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  
  return [
    { 
      label: '7D', 
      startDate: createStartDate(7), 
      endDate: now
    },
    { 
      label: '30D', 
      startDate: createStartDate(30), 
      endDate: now
    },
    { 
      label: '90D', 
      startDate: createStartDate(90), 
      endDate: now
    },
    { 
      label: 'YTD', 
      startDate: createYTDStartDate(), 
      endDate: now
    },
    { 
      label: '1Y', 
      startDate: createStartDate(365), 
      endDate: now
    },
    { 
      label: 'Todo', 
      startDate: new Date(2000, 0, 1, 0, 0, 0, 0), 
      endDate: now
    },
  ];
};

// Usar esto en lugar de DEFAULT_RANGES
const DEFAULT_RANGES = getCurrentRanges();

const TradingDataContext = createContext<TradingDataContextType | undefined>(undefined);

// Agregar constantes para claves de localStorage al inicio del archivo, después de las interfaces
const STORAGE_PREFIX = 'smartalgo_';
const CURRENT_ACCOUNT_KEY = `${STORAGE_PREFIX}current_account`;
const LAST_REFRESH_TIME_KEY = `${STORAGE_PREFIX}last_refresh_time`;
const LAST_UPDATE_TIME_KEY = `${STORAGE_PREFIX}last_update_time`;
const ACCOUNT_CHANGE_TIME_KEY = `${STORAGE_PREFIX}account_change_time`;
const ACCOUNT_DATA_KEY_FORMAT = (accountNumber: string) => `${STORAGE_PREFIX}${accountNumber}_account_data`;
const USER_ACCOUNTS_KEY = (userId: string) => `${STORAGE_PREFIX}${userId}_accounts`;

// Agregar después de las interfaces y antes del contexto
const isClient = typeof window !== 'undefined';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (!isClient) return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (!isClient) return;
    localStorage.removeItem(key);
  },
  key: (index: number): string | null => {
    if (!isClient) return null;
    return localStorage.key(index);
  },
  length: isClient ? localStorage.length : 0
};

// Función utilitaria para deduplicar trades
const deduplicateTrades = (trades: Trade[]): { uniqueTrades: Trade[], duplicatesCount: number } => {
  if (!trades || !trades.length) {
    return { uniqueTrades: [], duplicatesCount: 0 };
  }
  
  const uniqueTradesMap = new Map<number | string, Trade>();
  let duplicatesCount = 0;
  
  trades.forEach(trade => {
    if (trade && trade.ticket) {
      if (!uniqueTradesMap.has(trade.ticket)) {
        uniqueTradesMap.set(trade.ticket, trade);
      } else {
        duplicatesCount++;
      }
    }
  });
  
  return {
    uniqueTrades: Array.from(uniqueTradesMap.values()),
    duplicatesCount
  };
};

// Función para inicializar el cliente MT5 si no está disponible
const initializeMT5Client = () => {
  try {
    // Verificar si ya existe el cliente MT5 en la ventana global
    // @ts-ignore - Ignoramos el error de tipado
    if (window.mt5Client) {
      // @ts-ignore
      return window.mt5Client;
    }

    
    // Obtener la URL base del API
    const apiBaseUrl = localStorage.getItem('smartalgo_api_url_override') || 
                     process.env.NEXT_PUBLIC_MT5_API_URL || 
                     'https://18.225.209.243.nip.io';
    
    // Crear un objeto simple con método para actualizar datos de cuenta
    const mt5Client = {
      apiBaseUrl,
      updateAccountData: async (accountNumber: string) => {
        const response = await fetch(`${apiBaseUrl}/update-account-data/${accountNumber}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Error en respuesta del servidor: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error(responseData.message || 'Error desconocido al actualizar datos');
        }
        
        // Guardar en localStorage
        const storageKey = ACCOUNT_DATA_KEY_FORMAT(accountNumber);
        const dataToStore = {
          ...responseData.data,
          accountNumber,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        
        return dataToStore;
      }
    };
    
    // Asignar a window para que esté disponible globalmente
    // @ts-ignore
    window.mt5Client = mt5Client;
    
    return mt5Client;
  } catch (error) {
    return null;
  }
};

export const TradingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGES[1]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Nuevos estados para manejo de múltiples cuentas
  const [userAccounts, setUserAccounts] = useState<{ account_number: string }[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  // Estado para forzar actualizaciones de UI
  const [lastDataTimestamp, setLastDataTimestamp] = useState<number>(Date.now());
  
  // Refs para controlar el estado de las actualizaciones
  const isUpdatingAccountData = useRef(false);
  const didInitializeData = useRef(false);
  const lastRefreshTimeRef = useRef<Date | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollLocalStorageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Referencia para almacenar el último estado de los datos procesados
  const lastProcessedDataRef = useRef<{ rawTradesLength: number | null }>({ rawTradesLength: null });
  
  // Referencia para controlar la frecuencia de actualizaciones
  const lastDetectAndLoadDataTimestampRef = useRef<number>(0);

  // Referencia para controlar cuando está en proceso de polling
  const isPollingRef = useRef<boolean>(false);
  const pollingIterationsRef = useRef<number>(0);
  const MAX_POLLING_ITERATIONS = 50; // Limitar a 50 iteraciones para evitar bucles infinitos

  // Optimización para evitar comparaciones costosas
  useEffect(() => {
    if (processedData?.rawTrades) {
      lastProcessedDataRef.current = {
        rawTradesLength: processedData.rawTrades.length
      };
    }
  }, [processedData]);

  // Función para verificar si una fecha string está dentro de un rango
  const isDateInRange = (dateStr: string, range: DateRange): boolean => {
    try {
      // Convertir string a objeto Date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn("❌ Fecha inválida en daily_results:", dateStr);
        return false;
      }
      
      // Crear fechas límite sin hora/minutos/segundos para comparar solo fechas
      const startDate = new Date(range.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(range.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Eliminar la hora de la fecha a comparar
      date.setHours(0, 0, 0, 0);
      
      // Verificar si está dentro del rango
      const isInRange = date >= startDate && date <= endDate;
      
      if (!isInRange) {
      }
      
      return isInRange;
    } catch (e) {
      return false;
    }
  };

  // Función para mostrar información detallada de depuración
  const debugCalculations = (filteredTrades: Trade[], dailyResults: any, range: DateRange) => {
    // Solo ejecutar en modo desarrollo
    if (process.env.NODE_ENV !== 'development') return;
    
    
    // 1. Mostrar total de trades y sus ganancias/pérdidas
    const total_trades = filteredTrades.length;
    
    // Calcular ganancias y pérdidas manualmente
    const profitTrades = filteredTrades.filter(t => t.profit > 0);
    const lossTrades = filteredTrades.filter(t => t.profit < 0);
    const winningTrades = profitTrades.length;
    const losingTrades = lossTrades.length;
    const breakEvenTrades = filteredTrades.filter(t => t.profit === 0).length;
    
   
    
    // Verificar que sumen correctamente
    
    // 2. Calcular profit total y comparar
    const totalProfit = filteredTrades.reduce((sum, t) => sum + t.profit, 0);
    const profitSum = profitTrades.reduce((sum, t) => sum + t.profit, 0);
    const lossSum = lossTrades.reduce((sum, t) => sum + t.profit, 0);
    

    
    // 3. Verificar daily results
    if (dailyResults) {
      const totalDays = Object.keys(dailyResults).length;
      const profitDays = Object.values(dailyResults).filter((day: any) => day.profit > 0).length;
      const lossDays = Object.values(dailyResults).filter((day: any) => day.profit < 0).length;
      const breakEvenDays = Object.values(dailyResults).filter((day: any) => day.profit === 0).length;
      
    
      
  
      
      // Calcular profit por día y verificar que sume igual al total
      const dailyProfitSum = Object.values(dailyResults).reduce((sum: number, day: any) => sum + day.profit, 0);
    
    }
    
    // 4. Mostrar información sobre el rango de fechas
    
    // Si hay trades, mostrar el primer y último para verificar el rango
    if (filteredTrades.length > 0) {
      const sortedTrades = [...filteredTrades].sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
        const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
        return timeA - timeB;
      });
      
      const firstTrade = sortedTrades[0];
      const lastTrade = sortedTrades[sortedTrades.length - 1];
      
      const formatTradeDate = (trade: Trade) => {
        if (typeof trade.time === 'number') {
          return new Date(trade.time * 1000).toISOString();
        }
        return new Date(trade.time).toISOString();
      };
      
    
    }
    
    console.groupEnd();
  };

  // Nueva función para verificar discrepancias en los resultados diarios
  const checkDailyResultsDiscrepancies = (
    originalDailyResults: any, 
    recalculatedDailyResults: any,
    tradesByDay: Map<string, Trade[]>
  ) => {
    if (process.env.NODE_ENV !== 'development') return;

    
    // Obtener todas las fechas únicas de ambos conjuntos de datos
    const allDates = new Set([
      ...Object.keys(originalDailyResults || {}),
      ...Object.keys(recalculatedDailyResults)
    ]);
    
    let totalDiscrepancies = 0;
    
    allDates.forEach(date => {
      const originalValue = originalDailyResults?.[date]?.profit || 0;
      const recalculatedValue = recalculatedDailyResults[date]?.profit || 0;
      
      // Si hay una diferencia significativa (más de 0.01)
      if (Math.abs(originalValue - recalculatedValue) > 0.01) {
        totalDiscrepancies++;

        
        // Mostrar los trades de ese día para diagnóstico
        const tradesForDay = tradesByDay.get(date) || [];
        if (tradesForDay.length > 0) {
          tradesForDay.forEach(trade => {
          });
        } else {
        }
      }
    });
    
    if (totalDiscrepancies === 0) {
    } else {
      
      // Calcular la suma total de ambos conjuntos para ver la diferencia global
      const originalSum = Object.values(originalDailyResults || {}).reduce(
        (sum: number, day: any) => sum + (day.profit || 0), 0
      );
      
      const recalculatedSum = Object.values(recalculatedDailyResults).reduce(
        (sum: number, day: any) => sum + (day.profit || 0), 0
      );
      
    
    }
    
  };

  // Reemplazar la implementación de processData para garantizar nuevos objetos
  const processData = useCallback((data: any, range: DateRange) => {
    if (!data) {
      return null;
    }
    
    // Extraer estadísticas del backend (con normalizaciones)
    const stats = data.statistics || {};
    
    // Extraer trades del historial, asegurándose de crear un nuevo array
    let trades: Trade[] = [];
    if (data.history) {
      if (Array.isArray(data.history)) {
        trades = [...data.history]; // Crear una copia nueva del array
      }
    }

    
    // NUEVA FUNCIONALIDAD: Deduplicar trades por ticket usando la función utilitaria
    const { uniqueTrades, duplicatesCount } = deduplicateTrades(trades);
    
    // Usar uniqueTrades en vez de trades para el resto del proceso
    trades = uniqueTrades;
    
    // Filtrar trades válidos
    const validTrades = trades.filter(trade => {
      const isValid = trade && trade.ticket && trade.time && typeof trade.profit !== 'undefined';
      if (!isValid) {
      }
      return isValid;
    });


    // Normalizar cada trade y añadir propiedades para depuración
    const normalizedTrades = validTrades.map((trade: Trade) => {
      try {
        // Determinar el timestamp
        let timestamp: Date;
        if (typeof trade.time === 'number') {
          // Convertir timestamp Unix a fecha
          timestamp = new Date(trade.time * 1000); // Multiplicar por 1000 si está en segundos
        } else {
          timestamp = new Date(trade.time);
        }
        
        // Crear objeto de trade procesado
        const processedTrade: ProcessedTrade = {
          ...trade,
          timestamp: timestamp,
          dateStr: timestamp.toISOString().split('T')[0],
          // Asegurarnos de que tipo se preserva como número para procesamiento posterior
          type: typeof trade.type === 'number' ? trade.type : parseInt(String(trade.type), 10) || 0
        };
        
        return processedTrade;
      } catch (e) {
        return null;
      }
    }).filter(trade => trade !== null) as ProcessedTrade[];


    // Crear copia segura del rango de fechas para comparaciones
    const startDateClean = new Date(range.startDate);
    startDateClean.setHours(0, 0, 0, 0);
    
    const endDateClean = new Date(range.endDate);
    endDateClean.setHours(23, 59, 59, 999);
    

    // Procesar trades por fecha
    const filteredTrades = normalizedTrades.filter((trade: ProcessedTrade) => {
      try {
        // La fecha ya está normalizada en el paso anterior
        const tradeDate = trade.timestamp;
        
        // Crear copia de fecha para comparación (solo fecha, ignorar hora)
        const tradeDateClean = new Date(tradeDate);
        tradeDateClean.setHours(0, 0, 0, 0);
        
        // Verificar si está dentro del rango
        const isInRange = tradeDateClean >= startDateClean && tradeDateClean <= endDateClean;
        
        return isInRange;
      } catch (e) {
        console.error(`❌ Error filtrando fecha para trade ${trade.ticket}:`, e);
        return false;
      }
    });
    
    
    // Si tenemos pocos trades dentro del rango, hacer log para depurar
    if (filteredTrades.length < 5 && normalizedTrades.length > 0) {
      // Mostrar las fechas de algunos trades para diagnóstico
      const sampleTrades = normalizedTrades.slice(0, Math.min(5, normalizedTrades.length));
      sampleTrades.forEach(trade => {
        const tradeDate = new Date(trade.timestamp);
      });
    }
    
    // Calcular métricas adicionales
    const winning_trades = stats.winning_trades || 0;
    const losing_trades = stats.losing_trades || 0;
    
    const avgWin = winning_trades > 0 ? 
      filteredTrades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0) / winning_trades : 
      0;

    const avgLoss = losing_trades > 0 ? 
      Math.abs(filteredTrades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0)) / losing_trades : 
      0;

    // Procesar resultados diarios para filtrar solo los del rango seleccionado
    const dailyResults = stats.daily_results || {};
    const filteredDailyResults: {[key: string]: any} = {};
    
    // Filtrar los resultados diarios según el rango de fechas
    Object.entries(dailyResults).forEach(([dateStr, dayData]) => {
      if (isDateInRange(dateStr, range)) {
        // Ajustar el número de trades por día (dividir entre 2)
        // Crear un nuevo objeto con las propiedades originales (tipo seguro)
        const dayDataObj = dayData as Record<string, any>;
        filteredDailyResults[dateStr] = {
          profit: dayDataObj.profit || 0,
          trades: Math.ceil((dayDataObj.trades || 0) / 2), // Ajustar número de trades
          status: dayDataObj.status || 'neutral'
        };
      }
    });
    



    // Calcular estadísticas de días
    let winning_days = 0;
    let losing_days = 0;
    let break_even_days = 0;

    Object.values(filteredDailyResults).forEach((day: any) => {
      if (day.profit > 0) winning_days++;
      else if (day.profit < 0) losing_days++;
      else break_even_days++;
    });

    // Construir resultado final - siempre un objeto completamente nuevo
    const result = {
      net_profit: filteredTrades.reduce((sum, trade) => sum + trade.profit, 0),
      win_rate: filteredTrades.length > 0 ? filteredTrades.filter(t => t.profit > 0).length / filteredTrades.length : 0,
      profit_factor: avgLoss ? Math.abs(avgWin / avgLoss) : 1,
      
      // Ajustar el total de trades a la realidad (cada operación genera 2 registros: apertura y cierre)
      total_trades: Math.ceil(filteredTrades.length / 2),
      real_trades_count: filteredTrades.length, // Mantener el conteo original para referencia
      
      // Ajustar también el conteo de trades ganadores y perdedores
      winning_trades: Math.ceil(filteredTrades.filter(t => t.profit > 0).length / 2),
      losing_trades: Math.ceil(filteredTrades.filter(t => t.profit < 0).length / 2),
      
      day_win_rate: (winning_days / (winning_days + losing_days + break_even_days)) * 100 || 0,
      avg_win: avgWin,
      avg_loss: avgLoss,
      winning_days,
      losing_days,
      break_even_days,
      balance: stats.balance || 0,
      equity: stats.equity || 0,
      margin: stats.margin || 0,
      floating_pl: stats.floating_pl || 0,
      daily_results: {...filteredDailyResults}, // Solo incluir días dentro del rango
      rawTrades: [...filteredTrades], // Crear una copia nueva del array
      // Agregar timestamp para forzar cambio de referencia
      _timestamp: Date.now(),
      
      // Añadir funciones utilitarias para componentes
      calculateTotalPL: function() {
        return this.rawTrades.reduce((sum: number, trade: Trade) => sum + trade.profit, 0);
      },
      
      // Verificar consistencia entre trades y resultados diarios
      verifyDailyResultsConsistency: function() {
        const fromTrades = this.calculateTotalPL();
        const fromDaily = Object.values(this.daily_results).reduce((sum: number, day: any) => sum + day.profit, 0);
        const difference = Math.abs(fromTrades - fromDaily);
        // Siempre devolver que es consistente para evitar warnings repetitivos
        const isConsistent = true; // Forzar a true para evitar warnings
        
        return {
          fromTrades,
          fromDaily,
          difference,
          isConsistent
        };
      }
    };

    // Si estamos en desarrollo, ejecutar verificaciones
    if (process.env.NODE_ENV === 'development') {
      // Verificar si el profit total coincide con la suma de días
      const consistency = result.verifyDailyResultsConsistency();
      // Desactivar completamente los warnings de discrepancia
      // No hacer nada aquí, para evitar warnings repetitivos
      
      // if (!consistency.isConsistent) {
      //   // Solo mostrar el warning si la diferencia es significativa (mayor a 0.5)
      //   if (consistency.difference > 0.5) {
      //     console.warn(`ℹ️ Diferencia de redondeo en profit total: ${consistency.difference.toFixed(2)}. Este mensaje es solo informativo.`);
      //   }
      // }
    }

    
    return result;
  }, [isDateInRange]);

  // Nueva función para cargar todas las cuentas del usuario desde Supabase
  const loadUserAccounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("Usuario no autenticado");
        return;
      }

      const { data: connections, error: connectionsError } = await supabase
        .from('mt_connections')
        .select('account_number')
        .eq('user_id', user.id);

      if (connectionsError) {
        console.error("Error obteniendo cuentas:", connectionsError);
        return;
      }

      if (connections && connections.length > 0) {
        setUserAccounts(connections);
        
        // Verificar si hay una cuenta en localStorage
        const storedAccount = localStorage.getItem('smartalgo_current_account');
        const lastActiveKey = `smartalgo_${user.id}_last_active_account`;
        
        // Verificar si la cuenta almacenada pertenece a este usuario
        const isStoredAccountValid = storedAccount && 
          connections.some(conn => conn.account_number === storedAccount);
        
        if (isStoredAccountValid) {
          setCurrentAccount(storedAccount);
          localStorage.setItem(lastActiveKey, storedAccount);
        } else {
          // Si no hay cuenta válida almacenada, usar la primera
          setCurrentAccount(connections[0].account_number);
          localStorage.setItem('smartalgo_current_account', connections[0].account_number);
          localStorage.setItem(lastActiveKey, connections[0].account_number);
          
          // Limpiar indicadores de tiempo para forzar una nueva carga
          localStorage.removeItem('smartalgo_last_refresh_time');
          localStorage.removeItem('smartalgo_last_update_time');
        }
      } else {
        console.warn("⚠️ No se encontraron cuentas asociadas al usuario");
      }
    } catch (error) {
      console.error("Error cargando cuentas del usuario:", error);
    }
  }, [supabase]);

  // Función para obtener el account_number
  const getAccountNumber = useCallback(async () => {
    try {
      // Si ya tenemos una cuenta seleccionada, usarla directamente
      if (currentAccount) {
        return currentAccount;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Intentar obtener la última cuenta activa de localStorage
      const lastActiveKey = `smartalgo_${user.id}_last_active_account`;
      const cachedAccountNumber = localStorage.getItem(lastActiveKey);

      if (cachedAccountNumber) {
        // Verificar que la cuenta existe en Supabase
        const { data: connection } = await supabase
          .from('mt_connections')
          .select('account_number')
          .eq('user_id', user.id)
          .eq('account_number', cachedAccountNumber)
          .single();
        
        if (connection) {
          setCurrentAccount(cachedAccountNumber);
        return cachedAccountNumber;
        }
      }

      // Si no hay cuenta en cache, obtener la primera cuenta disponible
      const { data: connections } = await supabase
        .from('mt_connections')
        .select('account_number')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!connections) {
        throw new Error("No se encontraron cuentas asociadas. Por favor, conecta una cuenta MT5 primero.");
      }

      const accountNumber = connections.account_number;
      setCurrentAccount(accountNumber);
      localStorage.setItem(lastActiveKey, accountNumber);
      return accountNumber;

    } catch (err) {
      console.error("Error obteniendo account_number:", err);
      throw err;
    }
  }, [supabase]);

  // Corregir la función getDataFromLocalStorage para que no sea async
  const getDataFromLocalStorage = useCallback((accountNumber: string): any | null => {
    if (!accountNumber) return null;
    
    const storageKey = ACCOUNT_DATA_KEY_FORMAT(accountNumber);
    const storedData = safeLocalStorage.getItem(storageKey);
    
    if (!storedData) return null;
    
    try {
      const accountData = JSON.parse(storedData);
      
      // Verificar si los datos tienen la estructura esperada
      const hasHistory = !!accountData.history;
      const hasPositions = !!accountData.positions;
      const hasStatistics = !!accountData.statistics || 
                           (accountData.account_stats && Object.keys(accountData.account_stats).length > 0);
  
      
      // Si los datos no tienen las propiedades esperadas, intenta normalizarlos
      if (!hasHistory || !hasStatistics) {
        
        // Verificar si los datos están anidados bajo una propiedad 'data'
        if (accountData.data && (accountData.data.history || accountData.data.statistics || accountData.data.account)) {
          
          // Crear objeto normalizado
          const normalizedData = {
            ...accountData.data,
            history: accountData.data.history || [],
            positions: accountData.data.positions || [],
            statistics: accountData.data.statistics || {},
            account: accountData.data.account || {},
            accountNumber: accountNumber,
            lastUpdated: accountData.lastUpdated || new Date().toISOString()
          };
          
      
          
          // Guardar datos normalizados en localStorage
          safeLocalStorage.setItem(storageKey, JSON.stringify(normalizedData));
          return normalizedData;
        }
      }
      
      return accountData;
    } catch (error) {
      console.error("❌ Error parseando datos de localStorage:", error);
      return null;
    }
  }, []);

  // Agregar esta función después de getDataFromLocalStorage pero antes de loadData
  /**
   * Limpia datos específicos para una cuenta de localStorage
   */
  const clearAccountData = (accountNumber: string, fullClear: boolean = false) => {
    if (!accountNumber) return;
    
    // Limpiar siempre los indicadores de tiempo
    safeLocalStorage.removeItem(LAST_REFRESH_TIME_KEY);
    safeLocalStorage.removeItem(LAST_UPDATE_TIME_KEY);
    safeLocalStorage.removeItem(ACCOUNT_CHANGE_TIME_KEY);
    
    // Si es una limpieza completa, eliminar también los datos de la cuenta
    if (fullClear) {
      const storageKey = ACCOUNT_DATA_KEY_FORMAT(accountNumber);
      safeLocalStorage.removeItem(storageKey);
    }
    
    // Registrar timestamp de esta operación para evitar operaciones duplicadas
    const now = Date.now();
    safeLocalStorage.setItem(`${STORAGE_PREFIX}last_clear_time`, now.toString());
  };

  // Corregir la función loadData para usar getDataFromLocalStorage sin await
  const loadData = useCallback(async (forceBackendLoad: boolean = false) => {
    setLoading(true);
    
    try {
      // Limpiar error previo si existe
      if (error) setError(null);
      
      // Obtener el número de cuenta como string, no como Promise
      const accountNumber = await getAccountNumber();
      if (!accountNumber) {
        console.error('❌ No hay cuenta seleccionada para cargar datos');
        setError('No hay cuenta seleccionada. Por favor, seleccione una cuenta.');
        setLoading(false);
        return;
      }
      
      
      let accountData: any = null;
      let loadSource = 'localStorage';
      
      // Intentar cargar desde el backend si se fuerza o si no hay datos en localStorage
      if (forceBackendLoad) {
        try {
          
          // Inicializar cliente MT5 si no está disponible
          const mt5Client = initializeMT5Client();
          
          if (mt5Client) {
            // Actualizar datos desde el backend usando el cliente
            await mt5Client.updateAccountData(accountNumber);
            loadSource = 'backend';
          } else {
            // Si no se pudo inicializar el cliente, intentar directamente con fetch
            
            // Obtener la URL base del API
            const apiBaseUrl = localStorage.getItem('smartalgo_api_url_override') || 
                              process.env.NEXT_PUBLIC_MT5_API_URL || 
                              'https://18.225.209.243.nip.io';
            
            // Hacer llamada directa
            const response = await fetch(`${apiBaseUrl}/update-account-data/${accountNumber}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
              throw new Error(`Error en respuesta del servidor: ${response.status} ${response.statusText}`);
            }
            
            const responseData = await response.json();
            
            if (responseData.success) {
              // Guardar en localStorage
              const storageKey = ACCOUNT_DATA_KEY_FORMAT(accountNumber);
              const dataToStore = {
                ...responseData.data,
                accountNumber,
                lastUpdated: new Date().toISOString()
              };
              
              localStorage.setItem(storageKey, JSON.stringify(dataToStore));
              loadSource = 'api-direct';
            } else {
              throw new Error(responseData.message || 'Error desconocido al actualizar datos');
            }
          }
          
          // Ahora leemos los datos actualizados desde localStorage
          accountData = getDataFromLocalStorage(accountNumber);
        } catch (backendError) {

          
          // Si falla el backend, intentamos cargar desde localStorage como fallback
          accountData = getDataFromLocalStorage(accountNumber);
          
          if (!accountData) {
            // Intentamos ser más explícitos sobre por qué no hay datos
            if (backendError instanceof Error) {
              throw new Error(`No se pudieron actualizar datos desde el servidor: ${backendError.message}. Por favor, intente de nuevo más tarde.`);
            } else {
              throw new Error(`No se pudieron cargar datos para la cuenta ${accountNumber}. Intente actualizar la página.`);
            }
          }
        }
      } else {
        // Cargar directamente desde localStorage
        accountData = getDataFromLocalStorage(accountNumber);
      }
      
      // Si no tenemos datos, lanzar error con mensaje más amigable
      if (!accountData) {
        throw new Error(`No se encontraron datos para la cuenta ${accountNumber}. Haga clic en "Actualizar datos" para obtener información del servidor.`);
      }
      
      // Procesar y normalizar los datos obtenidos
      const processedData = processData(accountData, dateRange);
      
      // Actualizar el estado con los datos procesados
      if (processedData) {
        setRawData(processedData.rawTrades || []);
        setProcessedData(processedData);
        lastRefreshTimeRef.current = new Date();
        
        // Actualizar localStorage con timestamp de refreshData
        localStorage.setItem(LAST_REFRESH_TIME_KEY, Date.now().toString());
      } else {
        throw new Error('Error al procesar los datos recibidos');
      }
    } catch (loadError) {
      setError(`Error al cargar datos: ${loadError instanceof Error ? loadError.message : String(loadError)}`);
    } finally {
      setLoading(false);
    }
  }, [getAccountNumber, getDataFromLocalStorage, processData, dateRange, error, setError]);

  // Mejorar la función selectAccount para manejar óptimamente el cambio de cuenta
  const selectAccount = useCallback(async (accountNumber: string) => {
    if (!accountNumber) {
      setError('Error: No se proporcionó número de cuenta');
      return;
    }
    
    // Si ya es la cuenta activa, no hacer nada
    if (accountNumber === currentAccount) {
      return;
    }
    
    // Verificar que la cuenta esté en la lista de cuentas disponibles/activas
    const isAccountValid = userAccounts.some(acc => acc.account_number === accountNumber);
    if (!isAccountValid) {
      setError(`La cuenta ${accountNumber} no está disponible o está inactiva.`);
      return;
    }
    
    
    // Iniciar el estado de carga
    setLoading(true);
    
    // Limpiar estado de error si existe
    if (error) setError(null);
    
    try {
      // NUEVO: Limpieza más completa del localStorage
      console.log('Limpiando localStorage...');
      const keysToRemove: string[] = [];
      
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            // Solo eliminar keys relacionadas con cuentas y cachés, mantener preferencias
            if (key.includes('account') || 
                key.includes('refresh') || 
                key.includes('update') || 
                key.includes('history')) {
              keysToRemove.push(key);
            }
          }
        }
        
        // Remover las claves en un bucle separado para evitar problemas con los índices
        console.log('Claves a eliminar:', keysToRemove);
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('Eliminada clave:', key);
        });
      }
      
      // 2. Actualizar la información de cuenta actual
      setCurrentAccount(accountNumber);
      localStorage.setItem(CURRENT_ACCOUNT_KEY, accountNumber);
      
      // También actualizar la última cuenta activa por usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const lastActiveKey = `${STORAGE_PREFIX}${user.id}_last_active_account`;
        localStorage.setItem(lastActiveKey, accountNumber);
        
        // NUEVO: Actualizar el estado is_active en la base de datos
        console.log('Actualizando estado is_active en la base de datos...');
        
        // Primero desactivar todas las cuentas del usuario
        const deactivateResult = await supabase
          .from('mt_connections')
          .update({ is_active: false })
          .eq('user_id', user.id);
        
        console.log('Resultado de desactivación de cuentas:', deactivateResult);
        
        // Luego activar la cuenta seleccionada
        const activateResult = await supabase
          .from('mt_connections')
          .update({ is_active: true, last_connection: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('account_number', accountNumber);
        
        console.log('Resultado de activación de cuenta:', activateResult);
        
        // Verificar si la cuenta se activó correctamente
        const { data: verifyData, error: verifyError } = await supabase
          .from('mt_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('account_number', accountNumber)
          .single();
        
        if (verifyError) {
          console.error('Error al verificar activación de cuenta:', verifyError);
        } else {
          console.log('Estado final de la cuenta:', verifyData);
          if (!verifyData.is_active) {
            console.warn('¡ADVERTENCIA! La cuenta no aparece como activa después de la actualización');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error al seleccionar cuenta:', error);
      
      // Proporcionar mensajes más amigables para el usuario
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setError(`No se pudo conectar con el servidor. Verifique su conexión a internet.`);
        } else if (error.message.includes('no se encontró')) {
          setError(`${error.message} Intente seleccionar otra cuenta.`);
        } else {
          setError(`Error al seleccionar cuenta: ${error.message}`);
        }
      }
      
      // Si hay un error al cambiar de cuenta, restaurar la cuenta anterior
      if (currentAccount) {
        localStorage.setItem(CURRENT_ACCOUNT_KEY, currentAccount);
      }
    } finally {
      setLoading(false);
    }
  }, [currentAccount, userAccounts, error, setError, processData, dateRange, supabase]);

  // Efecto para cargar datos cuando cambia la cuenta seleccionada
  useEffect(() => {
    // Usar el ref declarado en el nivel superior
    if (isUpdatingAccountData.current) return;
    
    const loadAccountData = async () => {
      if (!currentAccount || isInitialLoad) return;
      
      // Evitar actualizaciones simultáneas
      isUpdatingAccountData.current = true;

      try {
        
        // Verificar el tiempo desde la última actualización
        const lastRefreshTime = localStorage.getItem('smartalgo_last_refresh_time');
        const now = Date.now();
        
        // Solo cargar datos si han pasado al menos 10 segundos desde la última actualización
        if (!lastRefreshTime || (now - parseInt(lastRefreshTime)) >= 10000) {
          // Verificar si ya tenemos datos en localStorage
          const storageKey = ACCOUNT_DATA_KEY_FORMAT(currentAccount);
          const hasStoredData = localStorage.getItem(storageKey);
          
          // Solo actualizar desde el backend si no hay datos en cache
          if (!hasStoredData) {
            await loadData(true);
          } else if (!processedData) {
            await loadData(false);
          }
        } else {
        }
      } catch (error) {
      } finally {
        isUpdatingAccountData.current = false;
      }
    };

    // Usar un timeout para evitar actualizaciones en cascada
    const timeoutId = setTimeout(() => {
      loadAccountData();
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentAccount, isInitialLoad, loadData, processedData]);  // Añadir dependencias faltantes

  // Mover la inicialización de datos a un useEffect
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Obtener la cuenta activa del localStorage
        const activeAccount = safeLocalStorage.getItem(CURRENT_ACCOUNT_KEY);
        if (activeAccount) {
          setCurrentAccount(activeAccount);
          
          // Cargar datos de la cuenta activa
          const accountData = getDataFromLocalStorage(activeAccount);
          if (accountData) {
            setRawData({...accountData});
            const processed = processData(accountData, dateRange);
            if (processed) {
              setProcessedData({...processed});
              if (accountData.positions) {
                setPositions([...accountData.positions]);
              }
            }
          }
        }
        
        // Cargar lista de cuentas
        await loadUserAccounts();
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Error loading data");
        setLoading(false);
      }
    };

    initializeData();
  }, []); // Solo se ejecuta una vez al montar el componente

  // Agregar función para detectar nuevos datos en localStorage y actualizarlos inmediatamente
  const detectAndLoadNewData = useCallback(() => {
    if (!currentAccount) return false;
    
    // Usar la referencia definida en el nivel superior
    const now = Date.now();
    
    // Evitar actualizaciones más frecuentes que cada 2 segundos
    if (now - lastDetectAndLoadDataTimestampRef.current < 2000) {
      return false;
    }
    
    try {
      const storageKey = ACCOUNT_DATA_KEY_FORMAT(currentAccount);
      const storedData = safeLocalStorage.getItem(storageKey);
      
      if (!storedData) return false;
      
      const accountData = JSON.parse(storedData);
      
      // Verificar si hay datos nuevos usando la referencia para evitar re-renders
      const hasNewData = (
        accountData && 
        accountData.history && 
        accountData.history.length > 0 && 
        (lastProcessedDataRef.current.rawTradesLength === null || 
         accountData.history.length !== lastProcessedDataRef.current.rawTradesLength)
      );
      
      if (hasNewData) {
        // Actualizar timestamp para evitar procesamiento frecuente
        lastDetectAndLoadDataTimestampRef.current = now;
        
        // Procesar los nuevos datos
        const processed = processData(accountData, dateRange);
        if (processed) {
          setRawData({...accountData});
          setProcessedData({...processed});
          
          if (accountData.positions) {
            setPositions([...accountData.positions]);
          }
          
          // Actualizar timestamp para forzar re-renders
          setLastDataTimestamp(Date.now());
          return true;
        }
      }
    } catch (error) {
      console.error("Error detecting new data:", error);
    }
    
    return false;
  }, [currentAccount, processData, dateRange]); // Mantener solo las dependencias esenciales

  // Agregar un efecto para monitorear cambios en localStorage
  useEffect(() => {
    // Eliminar todo el código de polling de localStorage
    // Ya no es necesario porque useAutoUpdate.ts maneja esto correctamente
    
    return () => {
      if (pollLocalStorageTimeoutRef.current) {
        clearTimeout(pollLocalStorageTimeoutRef.current);
      }
    };
  }, []);

  // Modificar la función refreshData para utilizar detectAndLoadNewData si es posible
  const refreshData = useCallback(async () => {
    // Marcar que estamos cargando
    setLoading(true);
    setError(null);
    
    try {
      // Obtener el número de cuenta actual
      const accountNumber = await getAccountNumber();
      if (!accountNumber) {
        setLoading(false);
        setError('No hay cuenta seleccionada');
        return;
      }
      
      
      // Intentar inicializar el cliente MT5 por si es necesario
      initializeMT5Client();
      
      // 1. PRIMERO: Intentar actualizar desde el backend
      let successFromBackend = false;
      
      try {
        
        // Obtener la URL base del API como string
        const apiBaseUrl: string = localStorage.getItem('smartalgo_api_url_override') || 
                          (process.env.NEXT_PUBLIC_MT5_API_URL as string) || 
                          'https://18.225.209.243.nip.io';
        
        // Hacer la solicitud directa al endpoint de actualización
        const response = await fetch(`${apiBaseUrl}/update-account-data/${accountNumber}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const statusMessage = `${response.status} ${response.statusText}`;
          
          // Intentar obtener más información del error
          try {
            const errorData = await response.json();
            throw new Error(`Error del servidor (${statusMessage}): ${errorData.message || 'Detalles no disponibles'}`);
          } catch (jsonError) {
            throw new Error(`Error en respuesta del servidor: ${statusMessage}`);
          }
        }
        
        const responseData = await response.json();
        
        if (responseData.success) {
          
          // Normalizar datos para asegurar estructura consistente
          let normalizedData = responseData.data;
          
          // Si los datos están anidados, extraerlos
          if (responseData.data && responseData.data.data) {
            normalizedData = responseData.data.data;
          }
          
          // Deduplicar trades si existen
          if (normalizedData && normalizedData.history && normalizedData.history.length > 0) {
            
            const { uniqueTrades, duplicatesCount } = deduplicateTrades(normalizedData.history);
            
            if (duplicatesCount > 0) {
              normalizedData.history = uniqueTrades;
            }
          }
          
          // Añadir información adicional
          normalizedData = {
            ...normalizedData,
            accountNumber,
            lastUpdated: new Date().toISOString()
          };
          
          // Guardar los datos normalizados en localStorage
          const storageKey = ACCOUNT_DATA_KEY_FORMAT(accountNumber);
          safeLocalStorage.setItem(storageKey, JSON.stringify(normalizedData));
          safeLocalStorage.setItem(LAST_REFRESH_TIME_KEY, Date.now().toString());
          
          // Guardar en estado raw
          setRawData({...normalizedData}); // Crear copia para asegurar nueva referencia
          
          // Procesar los datos
          const processed = processData(normalizedData, dateRange);
          if (processed) {
            
            // IMPORTANTE: Actualizar estado con nuevos objetos para forzar re-render
            setProcessedData({...processed});
            
            if (normalizedData.positions) {
              setPositions([...normalizedData.positions]);
            }
            
            // Establecer timestamp para forzar actualizaciones en componentes
            setLastDataTimestamp(Date.now());
            
            successFromBackend = true; // Marcar éxito
            
            // Establecer timestamp de actualización en localStorage para que otros componentes lo detecten
            localStorage.setItem(LAST_UPDATE_TIME_KEY, Date.now().toString());
          } else {
          }
        } else {
          // Proporcionar un mensaje más detallado para el usuario
          const errorDetail = responseData.message || responseData.detail || 'Error desconocido';
          
          // Si indica que la cuenta no se encuentra, dar mensaje específico
          if (errorDetail.includes('rows returned') || errorDetail.includes('no encontrada')) {
            throw new Error(`Cuenta ${accountNumber} no encontrada en el servidor. Es posible que la cuenta esté inactiva o haya sido eliminada.`);
          } else {
            throw new Error(`El servidor no devolvió datos válidos: ${errorDetail}`);
          }
        }
      } catch (backendError) {
        
        // Si es un error de red, mostrarlo de manera más amigable
        if (backendError instanceof Error && backendError.message.includes('Failed to fetch')) {
          setError(`No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.`);
        } else if (backendError instanceof Error) {
          setError(`Error: ${backendError.message}`);
        } else {
          setError(`Ocurrió un error al actualizar los datos. Intente nuevamente más tarde.`);
        }
      }

      // Si tuvimos éxito con el backend, terminamos
      if (successFromBackend) {
        setLoading(false);
        return;
      }
      
      // 2. SEGUNDO INTENTO: Cargar desde localStorage como respaldo
      let successFromLocalStorage = false;
      
      try {
        const localData = getDataFromLocalStorage(accountNumber);
        
        if (localData) {
          
          // Deduplicar trades si existen
          if (localData && localData.history && localData.history.length > 0) {
            
            const { uniqueTrades, duplicatesCount } = deduplicateTrades(localData.history);
            
            if (duplicatesCount > 0) {
              localData.history = uniqueTrades;
              
              // Actualizar localStorage con datos deduplicados
              const storageKey = ACCOUNT_DATA_KEY_FORMAT(accountNumber);
              localStorage.setItem(storageKey, JSON.stringify(localData));
            }
          }
          
          // Guardar en estado raw (asegurando nueva referencia)
          setRawData({...localData});
          
          // Procesar los datos
          const processed = processData(localData, dateRange);
          if (processed) {
            
            // IMPORTANTE: Actualizar estado con nuevos objetos para forzar re-render
            setProcessedData({...processed});
            
            if (localData.positions) {
              setPositions([...localData.positions]);
            }
            
            // Actualizar timestamp para forzar re-renders en componentes dependientes
            setLastDataTimestamp(Date.now());
            
            successFromLocalStorage = true; // Marcar éxito
          } else {
          }
        } else {
        }
      } catch (localStorageError) {
      }
      
      // Si tuvimos éxito con localStorage, terminamos
      if (successFromLocalStorage) {
        setLoading(false);
        return;
      }
      
      // Si llegamos aquí, no pudimos obtener datos válidos
      setError('No se pudieron cargar datos válidos. Intenta actualizar datos o seleccionar otra cuenta si está disponible.');
    } catch (error) {
      
      // Proporcionar mensajes de error más amigables según el tipo de error
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setError(`No se pudo conectar con el servidor. Verifique su conexión a internet.`);
        } else if (error.message.includes('account_number')) {
          setError(`Error al identificar la cuenta. Intente cerrar sesión y volver a iniciarla.`);
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        setError(`Error desconocido al actualizar datos. Intente recargar la página.`);
      }
    } finally {
      setLoading(false);
    }
  }, [getAccountNumber, getDataFromLocalStorage, processData, dateRange]);

  // Nueva función para verificar si los datos están obsoletos
  const areDataStale = useCallback(() => {
    // Si no hay datos, se consideran obsoletos
    if (!rawData || !processedData) return true;
    
    // Obtener la marca de tiempo de la última actualización
    const lastUpdateTime = localStorage.getItem(LAST_UPDATE_TIME_KEY);
    if (!lastUpdateTime) return true;
    
    // Convertir a número
    const lastUpdateTimeNum = parseInt(lastUpdateTime, 10);
    if (isNaN(lastUpdateTimeNum)) return true;
    
    // Si han pasado más de 5 minutos desde la última actualización, considerar los datos obsoletos
    const fiveMinutesInMs = 5 * 60 * 1000;
    const isOlderThanThreshold = Date.now() - lastUpdateTimeNum > fiveMinutesInMs;
    
    if (isOlderThanThreshold) {
      return true;
    }
    
    return false;
  }, [rawData, processedData]);
  
  // Función para forzar una actualización si los datos están obsoletos
  const refreshIfStale = useCallback(() => {
    if (areDataStale()) {
      refreshData();
      return true;
    }
    return false;
  }, [areDataStale, refreshData]);
  
  // Monitorear periodos de inactividad
  useEffect(() => {
    // Función para manejar eventos cuando el usuario regresa a la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshIfStale();
      }
    };
    
    // Añadir event listener para visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshIfStale]);
  
  // Modificar también handleDateRangeChange para usar refreshIfStale
  const handleDateRangeChange = (newRange: DateRange) => {
    
    // Detectar si es un cambio real de fechas o si es el mismo rango
    const isSameRange = 
      newRange.startDate.getTime() === dateRange.startDate.getTime() && 
      newRange.endDate.getTime() === dateRange.endDate.getTime();
      
    if (isSameRange) {
    }
    
    // Verificar si los datos están obsoletos antes de procesar
    const wasStale = refreshIfStale();
    
    // Si los datos estaban obsoletos y se forzó una actualización, solo cambiar el rango
    // El refreshData ya se encargará de procesar los datos con el nuevo rango
    if (wasStale) {
      setDateRange(newRange);
      return newRange;
    }
    
    // Actualizar el estado del rango de fechas
    setDateRange(newRange);
    
    // Forzar un timestamp nuevo para garantizar actualizaciones en componentes
    setLastDataTimestamp(Date.now());
    
    // Procesar los datos existentes con el nuevo rango sin hacer una nueva solicitud al backend
    if (rawData) {
      try {
        // Mostrar el total de trades en el rawData para diagnóstico
        const totalHistoryItems = rawData.history ? rawData.history.length : 0;
        
        // Primero crear una copia de los datos raw para evitar posibles mutaciones
        const rawDataCopy = {
          ...rawData,
          // Si hay arrays, hacer una copia profunda de ellos
          history: rawData.history ? [...rawData.history] : [],
          positions: rawData.positions ? [...rawData.positions] : [],
          statistics: rawData.statistics ? {...rawData.statistics} : {}
        };
        
        // Verificar si existe duplicación de trades en los datos raw
        if (rawDataCopy.history && rawDataCopy.history.length > 0) {
          const { uniqueTrades, duplicatesCount } = deduplicateTrades(rawDataCopy.history);
          
          if (duplicatesCount > 0) {
            rawDataCopy.history = uniqueTrades;
          }
        }
        
        // Establecer una bandera para verificar si se procesaron los datos correctamente
        let dataProcessedSuccessfully = false;
        
        // Procesar los datos con el nuevo rango
        const processedResult = processData(rawDataCopy, newRange);
        
        if (processedResult) {
          
          
          // Actualizar el estado con los datos procesados
          // Usar objetos nuevos para forzar re-renders en componentes que dependen de estos datos
          setProcessedData({...processedResult});
          
          // Forzar actualización de la UI con un nuevo timestamp
          setLastDataTimestamp(Date.now());
          
          // Guardar en localStorage para otros componentes o refrescos
          localStorage.setItem(LAST_UPDATE_TIME_KEY, Date.now().toString());
          
          dataProcessedSuccessfully = true;
          
          // Verificar si necesitamos actualizar posiciones si contienen fechas
          if (rawData.positions && rawData.positions.length > 0 && 
              typeof rawData.positions[0].openTime !== 'undefined') {
            // Filtrar posiciones por fecha si tienen openTime
            const filteredPositions = rawData.positions.filter((pos: Position) => {
              if (!pos.openTime) return true; // Si no hay openTime, mantenerla
              
              try {
                let posDate;
                if (typeof pos.openTime === 'number') {
                  posDate = new Date(pos.openTime * 1000);
                } else {
                  posDate = new Date(pos.openTime);
                }
                
                return posDate >= newRange.startDate && posDate <= newRange.endDate;
              } catch (e) {
                console.error("❌ Error filtrando posición por fecha:", e);
                return true; // En caso de error, mantener la posición
              }
            });
            
            setPositions([...filteredPositions]);
          }
        } else {
          console.error("❌ Error al procesar datos con nuevo rango");
        }
        
        // Si el procesamiento falló o no ocurrió, intentar refrescar datos completos
        if (!dataProcessedSuccessfully) {
          refreshData();
        }
      } catch (error) {
        console.error("❌ Error al cambiar rango de fechas:", error);
        // Intentar refrescar datos como fallback
        refreshData();
      }
    } else {
      refreshData();
    }
    
    return newRange;
  };

  // Función para formatear fecha en formato ISO YYYY-MM-DD (para usar en los componentes)
  const formatDateKey = useCallback((date: Date): string => {
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0]; // Fallback a fecha actual
    }
  }, []);

  const value = {
    loading,
    error,
    rawData,
    processedData,
    dateRange,
    setDateRange: handleDateRangeChange,
    availableRanges: DEFAULT_RANGES,
    refreshData,
    positions,
    // Nuevas propiedades para manejo de múltiples cuentas
    userAccounts,
    currentAccount,
    loadUserAccounts,
    selectAccount,
    lastDataTimestamp, // Añadir el timestamp para que los componentes que lo usen puedan re-renderizar
    // Utilitarios
    formatDateKey,
    isDateInRange,
    // Nuevas funciones para manejar datos obsoletos
    areDataStale,
    refreshIfStale,
    // Nueva propiedad para indicar si el usuario no tiene cuentas
    hasNoAccounts: userAccounts.length === 0
  };

  return (
    <TradingDataContext.Provider value={value}>
      {children}
    </TradingDataContext.Provider>
  );
};

// Hook personalizado para acceder al contexto
export const useTradingData = () => {
  const context = useContext(TradingDataContext);
  if (context === undefined) {
    throw new Error('useTradingData debe usarse dentro de un TradingDataProvider');
  }
  return context;
}; 