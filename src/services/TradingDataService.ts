import { format, subDays, isWithinInterval } from 'date-fns';
import { LocalStorageService } from './LocalStorageService';

// Definir interfaces para trabajar con tipos
export interface Trade {
  ticket?: string | number;
  symbol?: string;
  type?: string;
  volume?: number;
  price?: number;
  profit?: number;
  time?: string | number;
  commission?: number;
  swap?: number;
}

export interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

export interface ProcessedMetrics {
  // Métricas básicas
  net_profit: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  profit_factor: number;
  
  // Métricas adicionales
  avg_win: number;
  avg_loss: number;
  winning_days: number;
  losing_days: number;
  break_even_days: number;
  day_win_rate: number;
  
  // Datos de cuenta
  balance: number;
  equity: number;
  margin: number;
  margin_free: number;
  floating_pl: number;
  
  // Resultados diarios
  daily_results: Record<string, DailyResult>;
  
  // Metadatos
  accountId: string;
  accountNumber: string;
  lastUpdated: string;
}

export class TradingDataService {
  /**
   * Procesa los datos de una cuenta de trading
   */
  static processAccountData(accountData: any): ProcessedMetrics | null {
    if (!accountData) {
      console.error("No hay datos de cuenta para procesar");
      return null;
    }
    
    
    // Si ya tenemos estadísticas procesadas, usarlas directamente
    if (accountData.statistics) {
      
      return {
        // Información de cuenta
        accountId: accountData.accountId || accountData.connectionId || 'unknown',
        accountNumber: accountData.accountNumber || '',
        lastUpdated: accountData.lastUpdated || new Date().toISOString(),
        
        // Métricas básicas
        net_profit: parseFloat(accountData.statistics.net_profit || '0'),
        total_trades: parseInt(accountData.statistics.total_trades || '0', 10),
        winning_trades: parseInt(accountData.statistics.winning_trades || '0', 10),
        losing_trades: parseInt(accountData.statistics.losing_trades || '0', 10),
        win_rate: parseFloat(accountData.statistics.win_rate || '0'),
        profit_factor: parseFloat(accountData.statistics.profit_factor || '1'),
        
        // Métricas adicionales
        avg_win: parseFloat(accountData.statistics.avg_win || '0'),
        avg_loss: parseFloat(accountData.statistics.avg_loss || '0'),
        winning_days: parseInt(accountData.statistics.winning_days || '0', 10),
        losing_days: parseInt(accountData.statistics.losing_days || '0', 10),
        break_even_days: parseInt(accountData.statistics.break_even_days || '0', 10),
        day_win_rate: parseFloat(accountData.statistics.day_win_rate || '0'),
        
        // Datos de cuenta
        balance: parseFloat(accountData.statistics.balance || accountData.accountInfo?.balance || '0'),
        equity: parseFloat(accountData.statistics.equity || accountData.accountInfo?.equity || '0'),
        margin: parseFloat(accountData.statistics.margin || accountData.accountInfo?.margin || '0'),
        margin_free: parseFloat(accountData.statistics.margin_free || accountData.accountInfo?.margin_free || '0'),
        floating_pl: parseFloat(accountData.statistics.floating_pl || accountData.accountInfo?.floating_pl || '0'),
        
        // Resultados diarios
        daily_results: accountData.statistics.daily_results || {}
      };
    }
    
    // Si no hay estadísticas, calcularlas a partir de los trades
    
    return this.calculateMetricsFromTrades(accountData);
  }
  
  /**
   * Calcula métricas a partir de los trades en caso de no tener estadísticas
   */
  private static calculateMetricsFromTrades(accountData: any): ProcessedMetrics | null {
    let trades: Trade[] = [];
    
    // Extraer trades del historial si existe
    if (accountData.history && Array.isArray(accountData.history)) {
      // Si history es un array de arrays (formato típico)
      if (accountData.history.length > 0 && Array.isArray(accountData.history[0])) {
        trades = accountData.history[0];
      } 
      // Si history es un array simple de transacciones
      else if (accountData.history.length > 0) {
        trades = accountData.history;
      }
    }
    
    // Si no hay nada en history, buscar en closedTrades
    if (trades.length === 0 && Array.isArray(accountData.closedTrades)) {
      trades = accountData.closedTrades;
    }
    
    // Si todavía no hay trades, no podemos procesar
    if (trades.length === 0) {
      console.warn("TradingDataService: No se encontraron trades para procesar");
      return null;
    }
    
    // Procesar resultados diarios
    const dailyResults = this.processDailyResults(trades);
    
    // Calcular métricas generales
    let totalProfit = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    
    trades.forEach(trade => {
      const profit = parseFloat(String(trade.profit)) || 0;
      totalProfit += profit;
      
      if (profit > 0) {
        winningTrades++;
        totalWinAmount += profit;
      } else if (profit < 0) {
        losingTrades++;
        totalLossAmount += Math.abs(profit);
      }
    });
    
    // Calcular métricas de días
    let winningDays = 0;
    let losingDays = 0;
    let breakEvenDays = 0;
    
    Object.values(dailyResults).forEach(day => {
      if (day.status === 'win') winningDays++;
      else if (day.status === 'loss') losingDays++;
      else breakEvenDays++;
    });
    
    // Calcular métricas derivadas
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;
    const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0;
    
    const totalDays = winningDays + losingDays + breakEvenDays;
    const dayWinRate = totalDays > 0 ? (winningDays / totalDays) * 100 : 0;
    
    return {
      // Información de cuenta
      accountId: accountData.accountId || accountData.connectionId || 'unknown',
      accountNumber: accountData.accountNumber || '',
      lastUpdated: accountData.lastUpdated || new Date().toISOString(),
      
      // Métricas básicas
      net_profit: totalProfit,
      total_trades: totalTrades,
      winning_trades: winningTrades,
      losing_trades: losingTrades,
      win_rate: winRate,
      profit_factor: profitFactor,
      
      // Métricas adicionales
      avg_win: avgWin,
      avg_loss: avgLoss,
      winning_days: winningDays,
      losing_days: losingDays,
      break_even_days: breakEvenDays,
      day_win_rate: dayWinRate,
      
      // Datos de cuenta
      balance: parseFloat(accountData.accountInfo?.balance || '0'),
      equity: parseFloat(accountData.accountInfo?.equity || '0'),
      margin: parseFloat(accountData.accountInfo?.margin || '0'),
      margin_free: parseFloat(accountData.accountInfo?.margin_free || '0'),
      floating_pl: parseFloat(accountData.accountInfo?.floating_pl || '0'),
      
      // Resultados diarios
      daily_results: dailyResults
    };
  }
  
  /**
   * Procesa los trades para obtener resultados diarios
   */
  private static processDailyResults(trades: Trade[]): Record<string, DailyResult> {
    const dailyResults: Record<string, DailyResult> = {};
    
    trades.forEach((trade, index) => {
      try {
        // Verificar si tiene tiempo
        if (!trade.time) return;
        
        // Parsear la fecha
        let tradeDate: Date;
        
        if (typeof trade.time === 'string') {
          tradeDate = new Date(trade.time);
        } else if (typeof trade.time === 'number') {
          tradeDate = new Date(trade.time * 1000); // Convertir de UNIX timestamp
        } else {
          return;
        }
        
        if (isNaN(tradeDate.getTime())) return;
        
        // Formatear como YYYY-MM-DD
        const year = tradeDate.getFullYear();
        const month = String(tradeDate.getMonth() + 1).padStart(2, '0');
        const day = String(tradeDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Inicializar día si no existe
        if (!dailyResults[dateStr]) {
          dailyResults[dateStr] = {
            profit: 0,
            trades: 0,
            status: 'break_even'
          };
        }
        
        // Sumar profit y contar trade
        const profit = parseFloat(String(trade.profit)) || 0;
        dailyResults[dateStr].profit += profit;
        dailyResults[dateStr].trades += 1;
      } catch (error) {
        console.error(`Error procesando trade #${index}:`, error);
      }
    });
    
    // Determinar status de cada día
    Object.keys(dailyResults).forEach(date => {
      const result = dailyResults[date];
      if (result.profit > 0) {
        result.status = 'win';
      } else if (result.profit < 0) {
        result.status = 'loss';
      } else {
        result.status = 'break_even';
      }
    });
    
    return dailyResults;
  }
  
  /**
   * Procesa datos para un rango de fechas específico
   */
  static processDataByDateRange(accountData: any, startDate: Date, endDate: Date): ProcessedMetrics | null {
    // Primero procesamos todos los datos
    const allData = this.processAccountData(accountData);
    if (!allData) return null;
    
    // Si no hay datos diarios, devolver todo
    if (!allData.daily_results || Object.keys(allData.daily_results).length === 0) {
      return allData;
    }
    
    // Filtrar por rango de fechas
    const filteredDailyResults: Record<string, DailyResult> = {};
    let netProfit = 0;
    let totalTrades = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let winningDays = 0;
    let losingDays = 0;
    let breakEvenDays = 0;
    
    // Formatear fechas límite
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    // Filtrar y recalcular
    Object.entries(allData.daily_results).forEach(([dateStr, result]) => {
      if (dateStr >= startDateStr && dateStr <= endDateStr) {
        filteredDailyResults[dateStr] = result;
        
        // Actualizar contadores
        netProfit += result.profit;
        totalTrades += result.trades;
        
        if (result.status === 'win') {
          winningDays++;
        } else if (result.status === 'loss') {
          losingDays++;
        } else {
          breakEvenDays++;
        }
      }
    });
    
    // Si no hay datos en el rango, devolver null
    if (Object.keys(filteredDailyResults).length === 0) {
      return null;
    }
    
    // Recalcular métricas para el período filtrado
    // (Simplificado - en una implementación real, necesitaríamos recalcular todo con precisión)
    const dayWinRate = (winningDays + losingDays + breakEvenDays > 0) ? 
                      (winningDays / (winningDays + losingDays + breakEvenDays)) * 100 : 0;
    
    // Devolver datos filtrados
    return {
      ...allData,
      net_profit: netProfit,
      total_trades: totalTrades,
      winning_days: winningDays,
      losing_days: losingDays,
      break_even_days: breakEvenDays,
      day_win_rate: dayWinRate,
      daily_results: filteredDailyResults
    };
  }
  
  /**
   * Genera datos de ejemplo para pruebas
   */
  static generateSampleData(): ProcessedMetrics {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const dailyResults: Record<string, DailyResult> = {};
    let totalProfit = 0;
    let winningDays = 0;
    let losingDays = 0;
    let breakEvenDays = 0;
    
    // Generar 30 días de datos
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Generar resultado aleatorio para el día
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      
      if (isWeekend) {
        // No trading en fin de semana
        dailyResults[dateStr] = {
          profit: 0,
          trades: 0,
          status: 'break_even'
        };
        breakEvenDays++;
      } else {
        // Generar entre 0-5 trades por día
        const tradesCount = Math.floor(Math.random() * 6);
        
        if (tradesCount === 0) {
          // Sin trades este día
          dailyResults[dateStr] = {
            profit: 0,
            trades: 0,
            status: 'break_even'
          };
          breakEvenDays++;
        } else {
          // Día con trades
          let dayProfit = 0;
          
          // 60% probabilidad de día ganador
          const isWinningDay = Math.random() < 0.6;
          
          if (isWinningDay) {
            dayProfit = Math.random() * 100 + 10; // Entre $10 y $110
            winningDays++;
          } else {
            dayProfit = -(Math.random() * 80 + 10); // Entre -$10 y -$90
            losingDays++;
          }
          
          totalProfit += dayProfit;
          
          dailyResults[dateStr] = {
            profit: dayProfit,
            trades: tradesCount,
            status: dayProfit > 0 ? 'win' : dayProfit < 0 ? 'loss' : 'break_even'
          };
        }
      }
    }
    
    // Crear métricas completas
    return {
      accountId: 'sample-account',
      accountNumber: '12345678',
      lastUpdated: new Date().toISOString(),
      
      net_profit: totalProfit,
      total_trades: 75, // Aproximadamente 3 trades diarios x 25 días laborables
      winning_trades: 45,
      losing_trades: 30,
      win_rate: 60,
      profit_factor: 1.5,
      
      avg_win: 30,
      avg_loss: 25,
      winning_days: winningDays,
      losing_days: losingDays,
      break_even_days: breakEvenDays,
      day_win_rate: (winningDays / (winningDays + losingDays)) * 100,
      
      balance: 1000 + totalProfit,
      equity: 1050 + totalProfit,
      margin: 200,
      margin_free: 850 + totalProfit,
      floating_pl: 50,
      
      daily_results: dailyResults
    };
  }
} 