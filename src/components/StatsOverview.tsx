import React, { useEffect } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import StatCard from './StatCard';

const StatsOverview: React.FC = () => {
  const { processedData, loading, error, dateRange } = useTradingData();
  
  // Agregar logs para depuración
  useEffect(() => {
    if (processedData) {
      console.log(`Stats Overview - Datos procesados para rango ${dateRange.label}:`, {
        net_profit: processedData.net_profit,
        win_rate: processedData.win_rate,
        total_trades: processedData.total_trades,
        daily_results_count: Object.keys(processedData.daily_results || {}).length
      });
    }
  }, [processedData, dateRange]);
  
  // Si todavía no hay datos, mostrar un estado de carga
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
    day_win_rate = 0, 
    avg_win = 0, 
    avg_loss = 0,
    winning_days = 0,
    losing_days = 0,
    break_even_days = 0
  } = processedData;
  
  // Calcular el ratio de win/loss promedio, evitando división por cero
  const avgWinLossRatio = losing_trades && avg_loss !== 0 
    ? Math.abs(avg_win / avg_loss) 
    : 2.00; // Valor por defecto si no hay suficientes datos
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <StatCard 
        title={`Net P&L (${dateRange.label})`} 
        value={net_profit}
        prefix="$"
        info={true}
        totalTrades={total_trades}
        showPurpleIndicator={true}
        variant="profit"
      />
      <StatCard 
        title={`Trade win % (${dateRange.label})`} 
        value={win_rate * 100} // Convertir a porcentaje
        suffix="%"
        wins={winning_trades}
        losses={losing_trades}
        variant="winrate"
        info={true}
      />
      <StatCard 
        title={`Profit factor (${dateRange.label})`} 
        value={profit_factor}
        info={true}
        variant="profit-factor"
      />
      <StatCard 
        title={`Day win % (${dateRange.label})`} 
        value={day_win_rate}
        suffix="%"
        wins={winning_days}
        losses={losing_days}
        draws={break_even_days}
        variant="day-winrate"
        info={true}
      />
      <StatCard 
        title={`Avg win/loss (${dateRange.label})`} 
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