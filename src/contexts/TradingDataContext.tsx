'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocalStorageServiceNew as LocalStorageService } from '@/services/LocalStorageServiceNew';

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

interface MTrade {
  time: string;        // formato: "2025.03.05 04:07:33"
  ticket: number;      // ejemplo: 101136.00
  profit: number;      // ejemplo: 1.01, -1.01
  symbol?: string;     // símbolo del instrumento
  type?: string;       // tipo de operación
}

interface ProcessedTrade extends MTrade {
  timestamp: Date;     // fecha convertida a objeto Date
  dateStr: string;     // fecha en formato YYYY-MM-DD para agrupación
}

interface TradingDataContextType {
  loading: boolean;
  error: string | null;
  rawData: any;
  processedData: any & { rawTrades?: any[] };
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  availableRanges: DateRange[];
  refreshData: () => void;
  positions: Position[];
}

// Función para obtener rangos de fecha actuales
const getCurrentRanges = (): DateRange[] => {
  const now = new Date();
  
  return [
    { 
      label: '7D', 
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), 
      endDate: now
    },
    { 
      label: '30D', 
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30), 
      endDate: now
    },
    { 
      label: '90D', 
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90), 
      endDate: now
    },
    { 
      label: 'YTD', 
      startDate: new Date(now.getFullYear(), 0, 1), 
      endDate: now
    },
    { 
      label: '1Y', 
      startDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), 
      endDate: now
    },
    { 
      label: 'Todo', 
      startDate: new Date(2000, 0, 1), 
      endDate: now
    },
  ];
};

// Usar esto en lugar de DEFAULT_RANGES
const DEFAULT_RANGES = getCurrentRanges();

const TradingDataContext = createContext<TradingDataContextType | undefined>(undefined);

export const TradingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGES[1]); // Default: 30 días
  const [positions, setPositions] = useState<Position[]>([]);

  // Buscar cualquier cuenta disponible en localStorage
  const loadAnyAccount = useCallback(() => {
    try {
      // Buscar cualquier entrada en localStorage que parezca una cuenta
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('smartalgo_')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const data = JSON.parse(value);
              if (typeof data === 'object') {
                const accountIds = Object.keys(data);
                if (accountIds.length > 0) {
                  const account = data[accountIds[0]];
                  
                  // NUEVO: Procesar el historial para combinar operaciones de apertura/cierre
                  if (account.history) {
                    const processedHistory = processRawHistory(account.history);
                    account.history = processedHistory;
                  }
                  
                  console.log("Encontrada cuenta:", account);
                  return account;
                }
              }
            }
          } catch (e) {
            console.error("Error procesando", key, e);
          }
        }
      }
      
      // Si no encontramos nada, buscar en conexiones directas
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('connection')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const account = JSON.parse(value);
              
              // NUEVO: Procesar el historial para combinar operaciones de apertura/cierre
              if (account.history) {
                const processedHistory = processRawHistory(account.history);
                account.history = processedHistory;
              }
              
              console.log("Encontrada conexión:", account);
              return account;
            }
          } catch (e) {
            console.error("Error procesando conexión", key, e);
          }
        }
      }
      
      return null;
    } catch (err) {
      console.error("Error cargando datos:", err);
      return null;
    }
  }, []);

  // NUEVA función para procesar el historial raw
  const processRawHistory = (history: any[]): any[] => {
    if (!Array.isArray(history)) {
      return [];
    }

    // Si el historial está dentro de un array (como [history])
    const rawHistory = Array.isArray(history[0]) ? history[0] : history;
    
    // Mapa para agrupar operaciones por ticket
    const operationsByTicket = new Map();
    
    // Primero, agrupamos todas las operaciones por ticket
    rawHistory.forEach(operation => {
      if (!operation.ticket) return;
      
      if (!operationsByTicket.has(operation.ticket)) {
        operationsByTicket.set(operation.ticket, []);
      }
      operationsByTicket.get(operation.ticket).push(operation);
    });
    
    // Procesamos cada grupo de operaciones
    const processedOperations = [];
    operationsByTicket.forEach((operations, ticket) => {
      // Ordenamos las operaciones por tiempo
      operations.sort((a: any, b: any) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeA - timeB;
      });
      
      // Si hay múltiples operaciones para este ticket, tomamos solo la última
      // que debería ser la operación de cierre
      const closingOperation = operations.find(op => op.profit !== 0) || operations[operations.length - 1];
      
      if (closingOperation) {
        processedOperations.push(closingOperation);
      }
    });
    
    console.log(`Procesado historial: ${rawHistory.length} operaciones raw -> ${processedOperations.length} operaciones únicas`);
    
    return processedOperations;
  };

  // Función para cargar las posiciones
  const loadPositions = useCallback(() => {
    try {
      // Primero intentamos obtener las posiciones del localStorage
      const positionsData = localStorage.getItem('positions');
      if (positionsData) {
        const parsedPositions = JSON.parse(positionsData);
        console.log('Posiciones cargadas:', parsedPositions);
        setPositions(Array.isArray(parsedPositions) ? parsedPositions : []);
        return;
      }

      // Si no hay posiciones en 'positions', buscamos en las cuentas
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('smartalgo_')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const data = JSON.parse(value);
              if (typeof data === 'object') {
                const accountIds = Object.keys(data);
                if (accountIds.length > 0) {
                  const account = data[accountIds[0]];
                  if (account.positions && Array.isArray(account.positions)) {
                    console.log('Posiciones encontradas en cuenta:', account.positions);
                    setPositions(account.positions);
                    return;
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error procesando posiciones de cuenta:", e);
          }
        }
      }

      // Si no encontramos posiciones, establecemos un array vacío
      setPositions([]);
    } catch (err) {
      console.error("Error cargando posiciones:", err);
      setPositions([]);
    }
  }, []);

  // Procesar los datos basados en el rango de fechas
  const processData = useCallback((data: any, range: DateRange) => {
    if (!data) return null;
    
    console.log("Procesando datos para rango:", range);
    
    let trades = [];
    
    // Extraer trades
    if (Array.isArray(data.history[0])) {
      trades = data.history[0];
    } else if (Array.isArray(data.history)) {
      trades = data.history;
    } else if (Array.isArray(data.closedTrades)) {
      trades = data.closedTrades;
    }

    console.log(`Total de operaciones cargadas: ${trades.length}`);
    
    // NUEVO: Primero eliminamos duplicados por ticket antes de filtrar
    const uniqueTickets = new Set();
    const uniqueTrades = trades.filter(trade => {
      // Si no tiene ticket o ya hemos procesado este ticket, ignorar
      if (!trade.ticket || uniqueTickets.has(trade.ticket)) return false;
      
      // Solo considerar trades con profit (operaciones de cierre)
      if (trade.profit === 0 || trade.profit === undefined) return false;
      
      // Agregar ticket al conjunto de tickets procesados
      uniqueTickets.add(trade.ticket);
      return true;
    });
    
    console.log(`Operaciones únicas después de filtrar duplicados: ${uniqueTrades.length}`);
    
    // Filtrar por rango de fechas utilizando los trades únicos
    const filteredTrades = uniqueTrades.filter((trade: any) => {
      try {
        let tradeDate;
        
        if (typeof trade.time === 'string') {
          tradeDate = new Date(trade.time);
        } else if (typeof trade.time === 'number') {
          tradeDate = new Date(
            trade.time > 10000000000 ? trade.time : trade.time * 1000
          );
        } else {
          return false;
        }
        
        if (isNaN(tradeDate.getTime())) {
          console.warn("Fecha inválida en trade:", trade.time);
          return false;
        }
        
        return tradeDate >= range.startDate && tradeDate <= range.endDate;
      } catch (e) {
        console.error("Error filtrando trade por fecha:", e);
        return false;
      }
    });
    
    console.log(`Operaciones filtradas por rango: ${filteredTrades.length}`);
    
    // El resto del procesamiento igual, pero con los trades ya filtrados y deduplicados
    
    // Calcular métricas...
    let totalProfit = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    // Actualizar los cálculos de resultados diarios
    const dailyResults: { [key: string]: { profit: number; trades: number; status: string } } = {};
    let winningDays = 0;
    let losingDays = 0;
    let breakEvenDays = 0;

    filteredTrades.forEach((trade: any) => {
      try {
        // Procesar fecha
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
        
        const dateStr = tradeDate.toISOString().split('T')[0];
        const profit = parseFloat(String(trade.profit || 0));
        
        // Actualizar estadísticas generales
        totalProfit += profit;
        
        if (profit > 0) {
          winningTrades++;
          totalWinAmount += profit;
        } else if (profit < 0) {
          losingTrades++;
          totalLossAmount += Math.abs(profit);
        }

        // Actualizar estadísticas diarias
        if (!dailyResults[dateStr]) {
          dailyResults[dateStr] = { profit: 0, trades: 0, status: 'break_even' };
        }
        
        dailyResults[dateStr].profit += profit;
        dailyResults[dateStr].trades++; 
      } catch (e) {
        console.error("Error procesando trade:", e);
      }
    });

    // Resto del código igual...
    
    return {
      net_profit: totalProfit,
      win_rate: winningTrades / (winningTrades + losingTrades) * 100,
      profit_factor: totalWinAmount / totalLossAmount,
      total_trades: winningTrades + losingTrades,
      winning_trades: winningTrades,
      losing_trades: losingTrades,
      day_win_rate: winningTrades / (winningTrades + losingTrades) * 100,
      avg_win: totalWinAmount / winningTrades,
      avg_loss: totalLossAmount / losingTrades,
      winning_days: winningTrades > 0 ? 1 : 0,
      losing_days: losingTrades > 0 ? 1 : 0,
      break_even_days: 0,
      balance: data.accountInfo?.balance || 0,
      equity: data.accountInfo?.equity || 0,
      margin: data.accountInfo?.margin || 0,
      margin_free: data.accountInfo?.margin_free || 0,
      floating_pl: data.accountInfo?.floating_pl || 0,
      daily_results: dailyResults,
      max_drawdown: maxDrawdown,
      max_drawdown_percent: maxDrawdownPercent,
      rawTrades: filteredTrades,
    };
  }, []);

  // Cargar y procesar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar datos
      const accountData = loadAnyAccount();
      
      if (!accountData) {
        setError("No se encontraron datos de cuenta");
        return;
      }
      
      setRawData(accountData);
      
      // Cargar posiciones
      loadPositions();
      
      // Procesar datos según el rango seleccionado
      const processedResult = processData(accountData, dateRange);
      
      if (processedResult) {
        setProcessedData(processedResult);
        setError(null);
      } else {
        setError("No se pudieron procesar los datos");
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [loadAnyAccount, processData, dateRange, loadPositions]);

  // Efecto para cargar datos cuando cambia el rango de fechas
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Función para refrescar manualmente
  const refreshData = () => {
    loadData();
  };

  const value = {
    loading,
    error,
    rawData,
    processedData,
    dateRange,
    setDateRange,
    availableRanges: DEFAULT_RANGES,
    refreshData,
    positions,
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