'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocalStorageServiceNew as LocalStorageService } from '@/services/LocalStorageServiceNew';
import { MT5Client } from '@/services/mt5/mt5Client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

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
  time: string;
  profit: number;
  symbol?: string;
  type?: string;
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
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGES[1]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Mover processData aquí y envolverlo en useCallback
  const processData = useCallback((data: any, range: DateRange) => {
    if (!data) {
        console.log("❌ No hay datos para procesar");
      return null;
    }
    
    console.log("🔄 Procesando datos:", data);
    
    // Extraer estadísticas del backend
    const stats = data.statistics || {};
    console.log("📊 Estadísticas recibidas:", stats);

    // Extraer trades del historial
    let trades: Trade[] = [];
    if (data.history) {
        if (Array.isArray(data.history)) {
            trades = data.history.flat(); // Aplanar el array en caso de que venga anidado
        }
    }

    console.log(`📊 Trades cargados: ${trades.length}`);
    
    // Filtrar trades válidos
    const validTrades = trades.filter(trade => {
        const isValid = trade && trade.ticket && trade.time && typeof trade.profit !== 'undefined';
        if (!isValid) {
            console.warn("❌ Trade inválido:", trade);
        }
        return isValid;
    });

    // Procesar trades por fecha
    const filteredTrades = validTrades.filter((trade: Trade) => {
        try {
            let tradeDate: Date;
            if (typeof trade.time === 'number') {
                // Convertir timestamp Unix a fecha
                tradeDate = new Date(trade.time * 1000); // Multiplicar por 1000 si está en segundos
            } else {
          tradeDate = new Date(trade.time);
            }

            // Validar fecha
        if (isNaN(tradeDate.getTime())) {
                console.warn("❌ Fecha inválida:", trade.time);
          return false;
        }
        
        return tradeDate >= range.startDate && tradeDate <= range.endDate;
      } catch (e) {
            console.error("❌ Error procesando fecha:", e);
        return false;
      }
    });
    
    // Calcular métricas adicionales
    const avgWin = stats.winning_trades > 0 ? 
        filteredTrades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0) / stats.winning_trades : 
        0;

    const avgLoss = stats.losing_trades > 0 ? 
        Math.abs(filteredTrades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0)) / stats.losing_trades : 
        0;

    // Procesar resultados diarios
    const dailyResults = stats.daily_results || {};
    let winning_days = 0;
    let losing_days = 0;
    let break_even_days = 0;

    Object.values(dailyResults).forEach((day: any) => {
        if (day.profit > 0) winning_days++;
        else if (day.profit < 0) losing_days++;
        else break_even_days++;
    });

    // Construir resultado final
    const result = {
        net_profit: stats.total_profit || 0,
        win_rate: stats.win_rate || 0,
        profit_factor: avgLoss ? Math.abs(avgWin / avgLoss) : 1,
        total_trades: stats.total_trades || 0,
        winning_trades: stats.winning_trades || 0,
        losing_trades: stats.losing_trades || 0,
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
      daily_results: dailyResults,
        rawTrades: filteredTrades
    };

    console.log("✅ Datos procesados:", result);
    return result;
  }, []);

  // Función para obtener el account_number (primero localStorage, luego Supabase)
  const getAccountNumber = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // 1. Intentar obtener del localStorage
      const lastActiveKey = `smartalgo_${user.id}_last_active_account`;
      const cachedAccountNumber = localStorage.getItem(lastActiveKey);

      if (cachedAccountNumber) {
        console.log("📱 Cuenta encontrada en cache:", cachedAccountNumber);
        return cachedAccountNumber;
      }

      // 2. Si no está en cache, buscar en Supabase
      console.log("🔍 Buscando cuenta en base de datos...");
      const { data: connections, error: connectionsError } = await supabase
        .from('mt_connections')
        .select('account_number')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (connectionsError) throw connectionsError;
      if (!connections) throw new Error("No se encontraron cuentas asociadas");

      const accountNumber = connections.account_number;
      
      // Guardar en localStorage para futuras referencias
      localStorage.setItem(lastActiveKey, accountNumber);
      
      console.log("✅ Cuenta encontrada en BD:", accountNumber);
      return accountNumber;

    } catch (err) {
      console.error("Error obteniendo account_number:", err);
      throw err;
    }
  }, [supabase]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
        setError(null);

        // 1. Obtener el account_number
        const accountNumber = await getAccountNumber();

        if (!accountNumber) {
            setError("No se encontró número de cuenta");
            return;
        }

        // 2. Enviar al backend para actualización
        const mt5Client = MT5Client.getInstance();
        console.log("🔄 Solicitando actualización para cuenta:", accountNumber);
        
        try {
            const response = await mt5Client.updateAccountData(accountNumber);

            if (!response.success) {
                setError("Error actualizando datos de la cuenta");
                return;
            }

            // Obtener los datos del localStorage después de la actualización
            const storedData = localStorage.getItem(`smartalgo_${accountNumber}_account_data`);
            if (!storedData) {
                setError("No se encontraron datos en localStorage");
        return;
      }

            const accountData = JSON.parse(storedData);
            console.log("📊 Datos obtenidos de localStorage:", accountData);
      
      setRawData(accountData);
      
            if (accountData.positions) {
                const convertedPositions: Position[] = accountData.positions.map((pos: MT5Position) => ({
                    ticket: pos.ticket,
                    symbol: pos.symbol,
                    type: pos.type.toString(),
                    volume: pos.volume,
                    openTime: pos.time,
                    openPrice: pos.open_price,
                    stopLoss: pos.sl,
                    takeProfit: pos.tp,
                    profit: pos.profit
                }));
                setPositions(convertedPositions);
            }
            
            // Procesar los datos
      const processedResult = processData(accountData, dateRange);
            console.log("🔄 Resultado procesado:", processedResult);
      
      if (processedResult) {
        setProcessedData(processedResult);
        setError(null);
      } else {
        setError("No se pudieron procesar los datos");
      }
        } catch (error: any) {
            console.error("Error en la actualización:", error);
            setError(error.message || "Error actualizando datos");
        }

    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
}, [dateRange, processData, getAccountNumber]);

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