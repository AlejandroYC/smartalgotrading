import React, { useEffect } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import StatCard from './StatCard';

const StatsOverview: React.FC = () => {
  const { processedData, loading, error, dateRange } = useTradingData();
  
  // Agregar logs para depuración
  if (loading || !processedData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading trading data...</p>
        </div>
      </div>
    );
  }
  
  // Si hay un error, mostrarlo
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }
  
  // Desestructurar los datos procesados y agregar valores por defecto
  const { 
    net_profit = 0, 
    win_rate = 0, 
    profit_factor = 1, 
    total_trades = 0, 
    winning_trades = 0, 
    losing_trades = 0, 
    breakeven_trades = 0,
    day_win_rate = 0, 
    avg_win = 0, 
    avg_loss = 0,
    winning_days = 0,
    losing_days = 0,
    break_even_days = 0,
    rawTrades = []
  } = processedData;
  
  // Volver a las definiciones originales (completamente dinámicas)
  const directWinningTrades = rawTrades && rawTrades.length > 0 
    ? rawTrades.filter((t: any) => t.profit > 0).length 
    : winning_trades * 2;
  
  const directLosingTrades = rawTrades && rawTrades.length > 0 
    ? rawTrades.filter((t: any) => t.profit < 0).length 
    : losing_trades * 2;
  
  // Contar los breakeven trades y ajustarlos - intentar distinguir operaciones reales
  const rawBreakEvenTrades = rawTrades && rawTrades.length > 0 
    ? rawTrades.filter((t: any) => {
        // SOLO contar operaciones que tienen profit=0 Y están cerradas (entry=1)
        return Number(t.profit) === 0 && t.entry === 1;
      }).length 
    : breakeven_trades;
    
  // Analizar directamente una muestra de operaciones para entender mejor la estructura
  if (rawTrades && rawTrades.length > 0) {
    console.log('MUESTRA DE OPERACIONES:', {
      primerTrade: rawTrades[0],
      ultimoTrade: rawTrades[rawTrades.length - 1],
      // Mostrar hasta 3 operaciones con profit=0 si existen
      operacionesConProfit0: rawTrades.filter((t: any) => Number(t.profit) === 0).slice(0, 3)
    });
  }
  
  // Log para ayudar a depurar el problema de breakeven trades
  console.log('FILTRO DE OPERACIONES BREAKEVEN:', {
    total_rawTrades: rawTrades?.length || 0,
    rawBreakEvenTrades,
    operacionesProfit0Entry1: rawTrades?.filter((t: any) => Number(t.profit) === 0 && t.entry === 1)?.length || 0,
    operacionesProfit0Entry0: rawTrades?.filter((t: any) => Number(t.profit) === 0 && t.entry === 0)?.length || 0,
    breakeven_trades,
  });
  
  // No ajustamos los valores directos de wins y losses porque ya vienen correctos
  const winTradesAdjusted = winning_trades;
  const loseTradesAdjusted = losing_trades;
  
  // Usar el valor real de breakeven_trades de los datos procesados
  const breakEvenTradesAdjusted = breakeven_trades;
  
  // Usar este valor dinámico
  const directBreakEvenTrades = breakEvenTradesAdjusted;
  
  // Calcular directamente el win rate correcto (sin incluir breakevens)
  const directWinRate = winTradesAdjusted + loseTradesAdjusted > 0 
    ? (winTradesAdjusted / (winTradesAdjusted + loseTradesAdjusted)) * 100 
    : 0;
  
  // Calcular también el win rate incluyendo breakeven en el denominador, para verificar
  const winRateWithBreakeven = winTradesAdjusted + loseTradesAdjusted + directBreakEvenTrades > 0
    ? (winTradesAdjusted / (winTradesAdjusted + loseTradesAdjusted + directBreakEvenTrades)) * 100
    : 0;
    
  console.log('CÁLCULO DE WIN RATE:', {
    winTradesAdjusted,
    loseTradesAdjusted,
    directBreakEvenTrades,
    winRateExcluyendoBreakeven: directWinRate.toFixed(2) + '%',
    winRateIncluyendoBreakeven: winRateWithBreakeven.toFixed(2) + '%'
  });
  
  // Usamos el valor filtrado directamente 
  const breakEvenTradesCount = processedData?.raw_breakeven_trades || processedData?.breakeven_trades || 0;
  
  // Log para depuración
  console.log('STATS OVERVIEW:', {
    winning_trades,
    losing_trades,
    breakeven_trades,
    raw_breakeven: processedData?.raw_breakeven_trades,
    breakEvenTradesCount
  });
  
  // Calcular el ratio de win/loss promedio, evitando división por cero
  const avgWinLossRatio = losing_trades && avg_loss !== 0 
    ? Math.abs(avg_win / avg_loss) 
    : 2.00; // Valor por defecto si no hay suficientes datos
  
  // Log para información de profit factor
  console.log('PROFIT FACTOR STATS:', {
    profit_factor,
    processedDataValue: processedData?.profit_factor
  });
  
  // Log para verificar días ganadores y perdedores
  console.log('DÍAS DE TRADING:', {
    winning_days,
    losing_days,
    break_even_days,
    day_win_rate: (winning_days / (winning_days + losing_days)) * 100,
    day_win_rate_con_breakeven: day_win_rate,
    valor_esperado: (4 / (4 + 15)) * 100, // 21.05%
    diferencia_con_esperado: (4 / (4 + 15)) * 100 - (winning_days / (winning_days + losing_days)) * 100
  });
  
  // Calcular el número real de trades basado en ganadoras + perdedoras + breakeven
  const actualTotalTrades = winTradesAdjusted + loseTradesAdjusted + directBreakEvenTrades;
  
  // Comparar con el valor de total_trades para detectar discrepancias
  console.log('VERIFICACIÓN DE TOTAL TRADES:', {
    total_trades_reportado: total_trades,
    actual_trades_calculados: actualTotalTrades,
    discrepancia: total_trades - actualTotalTrades
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      <StatCard 
        title={`Net P&L`} 
        value={net_profit}
        prefix="$"
        info={true}
        totalTrades={actualTotalTrades}
        showPurpleIndicator={true}
        variant="profit"
      />
      <StatCard 
        title={`Trade win %`} 
        value={directWinRate}
        suffix="%"
        wins={winTradesAdjusted}
        losses={loseTradesAdjusted}
        draws={directBreakEvenTrades}
        variant="winrate"
        info={true}
      />
      <StatCard 
        title={`Profit factor`} 
        value={profit_factor}
        info={true}
        variant="profit-factor"
      />
      <StatCard 
        title={`Day win %`} 
        value={day_win_rate}
        suffix="%"
        wins={winning_days}
        losses={losing_days}
        draws={break_even_days}
        variant="day-winrate"
        info={true}
      />
      <StatCard 
        title={`Avg win/loss trade `} 
        value={avgWinLossRatio}
        winAmount={avg_win}
        lossAmount={avg_loss}
        variant="avg-trade"
        info={true}
      />
    </div>
  );
};

export default StatsOverview; 