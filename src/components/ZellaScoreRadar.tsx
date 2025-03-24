'use client';
import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
  Tooltip
} from 'recharts';
import EmptyStateCard from './EmptyStateCard';
import { useTradingData } from '@/contexts/TradingDataContext';
import { filterDepositsFromMetrics } from '@/contexts/TradingDataContext';

// Componente SVG para el ícono de información
const InfoIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-5 w-5 text-gray-500" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);

interface ZellaMetric {
  name: string;
  value: number;
  description: string;
}

interface ZellaScoreProps {
  className?: string;
}

// Crear versiones estables de las funciones de cálculo fuera del componente
const normalizeValue = (value: number, min: number, max: number, defaultValue = 0, name = ''): number => {
  if (value === undefined || value === null || isNaN(value)) return defaultValue;
  
  // Asegurar que está entre min y max, luego convertir a escala 0-5
  const clampedValue = Math.max(min, Math.min(max, value));
  const normalized = ((clampedValue - min) / (max - min)) * 5;
  
  // Log para diagnóstico
  console.log(`NORMALIZACIÓN ${name}:`, {
    valorOriginal: value,
    valorAjustado: clampedValue,
    min, 
    max,
    valorNormalizado: normalized.toFixed(2)
  });
  
  return normalized;
};

const ZellaScoreRadar: React.FC<ZellaScoreProps> = React.memo(({ className = '' }) => {
  // Usar el contexto en lugar de props
  const { processedData, loading } = useTradingData();
  
  // Verificar si hay suficientes datos para mostrar - memoizado para estabilidad
  const hasTrades = useMemo(() => processedData?.total_trades > 0, [processedData?.total_trades]);

  // Calcular métricas para el Zella Score - memoizado para evitar cálculos repetidos
  const metrics: ZellaMetric[] = useMemo(() => {
    if (!processedData) return [];

    // Usar la función filtrada en lugar de implementar lógica aquí
    const filteredData = filterDepositsFromMetrics(processedData);
    
    // Log para verificación
    console.log('ZELLARADAR: Utilizando datos filtrados automáticamente:', filteredData);
    
    // Recalcular las métricas excluyendo depósitos
    // Solo proceder si hay trades válidos (excluyendo depósitos)
    const validTrades = filteredData.rawTrades?.filter((t: any) => t.type !== 2) || [];
    
    if (validTrades.length === 0) {
      console.log('No hay trades válidos (excluyendo depósitos)');
      return [];
    }
    
    // Calcular win rate real
    const winners = validTrades.filter((t: any) => t.profit > 0).length;
    const losers = validTrades.filter((t: any) => t.profit < 0).length;
    const totalWL = winners + losers;
    const filteredWinRate = totalWL > 0 ? winners / totalWL : 0;
    
    // Calcular profit factor real
    const grossWins = validTrades
      .filter((t: any) => t.profit > 0)
      .reduce((sum: number, t: any) => sum + Number(t.profit), 0);
      
    const grossLosses = Math.abs(validTrades
      .filter((t: any) => t.profit < 0)
      .reduce((sum: number, t: any) => sum + Number(t.profit), 0));
      
    const filteredProfitFactor = grossLosses > 0 ? grossWins / grossLosses : 1;
    
    // Calcular avg win/loss real
    const filteredAvgWin = winners > 0 
      ? validTrades.filter((t: any) => t.profit > 0).reduce((sum: number, t: any) => sum + Number(t.profit), 0) / winners 
      : 0;
      
    const filteredAvgLoss = losers > 0 
      ? Math.abs(validTrades.filter((t: any) => t.profit < 0).reduce((sum: number, t: any) => sum + Number(t.profit), 0) / losers)
      : 0;
    
    // Calcular net profit real
    const filteredNetProfit = validTrades.reduce((sum: number, t: any) => sum + Number(t.profit), 0);
    
    // Recovery factor usando el drawdown real
    const recoveryFactor = filteredData.max_drawdown > 0 ? 
      filteredNetProfit / filteredData.max_drawdown : 0;
    
    // Usar max drawdown real
    const maxDrawdownPercent = filteredData.max_drawdown_percent || 0;
    
    // Usar day win rate real
    const dayWinRate = filteredData.day_win_rate || 0;

    // Log de métricas reales
    console.log('MÉTRICAS REALES PARA ZELLA SCORE:', {
      win_rate: filteredWinRate,
      profit_factor: filteredProfitFactor,
      avg_win: filteredAvgWin,
      avg_loss: filteredAvgLoss,
      avg_win_loss_ratio: filteredAvgLoss > 0 ? filteredAvgWin / filteredAvgLoss : 0,
      net_profit: filteredNetProfit,
      max_drawdown: filteredData.max_drawdown,
      max_drawdown_percent: maxDrawdownPercent,
      recovery_factor: recoveryFactor,
      day_win_rate: dayWinRate
    });

    // Ajuste de escalas para mostrar valores en radar más parecidos a tradezella.com
    return [
      {
        name: 'Win %',
        // Escala más restrictiva para win rate - menos prominente en bajos valores
        value: Math.min(5, (Math.pow(filteredWinRate, 1.2) * 3.8)),
        description: 'Porcentaje de operaciones ganadoras'
      },
      {
        name: 'Profit factor',
        // Escala más restrictiva para profit factor
        value: Math.min(5, filteredProfitFactor < 1 ? 
          filteredProfitFactor * 0.9 : 
          0.9 + (filteredProfitFactor - 1) * 1.2),
        description: 'Relación entre ganancias y pérdidas'
      },
      {
        name: 'Avg win/loss',
        // Escala reducida para avg win/loss
        value: Math.min(5, filteredAvgLoss > 0 ? 
          (filteredAvgWin / filteredAvgLoss < 1 ?
            (filteredAvgWin / filteredAvgLoss) * 1.2 :
            1.2 + (filteredAvgWin / filteredAvgLoss - 1) * 0.8) : 0),
        description: 'Proporción promedio de ganancia/pérdida'
      },
      {
        name: 'Recovery factor',
        // Escala más restrictiva para recovery factor
        value: Math.min(5, Math.min(1.5, recoveryFactor)),
        description: 'Capacidad de recuperación de drawdowns'
      },
      {
        name: 'Max drawdown',
        // Escala más restrictiva para max drawdown
        // Para drawdown, valores menores son mejores
        value: Math.min(5, Math.max(0, 2 - (maxDrawdownPercent / 30))),
        description: 'Máxima pérdida desde máximos (%)'
      },
      {
        name: 'Consistency',
        // Ajustado para que day win rate sea más prominente
        value: Math.min(5, (dayWinRate / 100) * 3.0),
        description: 'Porcentaje de días ganadores'
      },
    ];
  }, [processedData]);
  
  // Calcular el Zella Score basado en las métricas reales
  const zellaScore = useMemo(() => {
    if (!hasTrades || !metrics.length) return 0;
    
    // Si no hay operaciones ganadoras, el score debe ser 0
    if (!processedData.rawTrades || processedData.rawTrades.length === 0) {
      console.log('ZELLA SCORE: 0 - No hay operaciones para calcular');
      return 0;
    }
    
    // Pesos para cada métrica (ajustados para coincidir con la referencia)
    const weights: { [key: string]: number } = {
      'Win %': 0.22,
      'Profit factor': 0.22,
      'Avg win/loss': 0.18,
      'Recovery factor': 0.10,
      'Max drawdown': 0.14,
      'Consistency': 0.14,
    };
    
    // Calcular suma ponderada
    let weightedSum = 0;
    let totalWeight = 0;
    
    // Valores para diagnóstico
    const metricContributions: {[key: string]: number} = {};
    
    metrics.forEach(metric => {
      const weight = weights[metric.name] || 0;
      const contribution = metric.value * weight;
      weightedSum += contribution;
      totalWeight += weight;
      
      // Guardar contribución para diagnóstico
      metricContributions[metric.name] = contribution;
    });
    
    // FACTOR CORREGIDO: Aumentado para compensar los valores más bajos en las métricas
    // y mantener el Zella Score alrededor de 26
    const adjustmentFactor = 1.22; // Ajustado para mantener el score original de ~26
    
    // Log para diagnóstico detallado del cálculo
    console.log('CÁLCULO DETALLADO DEL ZELLA SCORE:');
    console.log('Métricas utilizadas:', metrics);
    console.log('Factor de ajuste aplicado:', adjustmentFactor);
    console.log('Valor de weightedSum:', weightedSum);
    console.log('Valor de totalWeight:', totalWeight);
    console.log('Cálculo final:', (weightedSum / totalWeight) * 20 * adjustmentFactor);
    
    const finalScore = (weightedSum / totalWeight) * 20 * adjustmentFactor;
    
    // Log para diagnóstico
    console.log('CÁLCULO DE ZELLA SCORE:', {
      contribucionesPorMétrica: metricContributions,
      sumaTotal: weightedSum,
      pesoTotal: totalWeight,
      factorAjuste: adjustmentFactor,
      zellaScoreFinal: finalScore.toFixed(2)
    });
    
    return finalScore;
  }, [hasTrades, metrics, processedData]);
  
  // Formato para el radar chart - memoizado para evitar recreación de objetos
  const formattedData = useMemo(() => 
    metrics.map(metric => ({
      subject: metric.name,
      value: metric.value,
      fullMark: 5,
    })), 
  [metrics]);

  // Si está cargando, mostrar un indicador
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Zella Score</h3>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Si no hay suficientes trades, mostrar estado vacío
  if (!hasTrades) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Zella Score</h3>
        </div>
        <EmptyStateCard 
          icon="trades" 
          message="Available once there is at least 1 trade."
        />
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow h-full ${className}`}>
      <div className="flex items-center mb-3">
        <h2 className="text-2xl font-bold text-gray-800">Zella score</h2>
        <div className="ml-2">
          <InfoIcon />
        </div>
      </div>
      <hr className="w-full border-t border-gray-200 mb-4" />

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="70%" 
            data={formattedData}
          >
            <PolarGrid 
              gridType="polygon" 
              stroke="#A5B4FC" 
              strokeOpacity={0.2} 
            />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#6366F1', fontSize: 14, opacity: 0.9 }}
              axisLine={false}
            />
            <PolarRadiusAxis 
              domain={[0, 5]} 
              tick={false} 
              axisLine={false}
              tickCount={6}
              stroke="#A5B4FC"
              opacity={0.4}
            />
            <Tooltip 
              formatter={(value, name, props) => {
                // Buscar la métrica original para mostrar el valor real
                const metricName = props.payload.subject;
                const originalData = processedData;
                
                // Log para diagnóstico de las propiedades disponibles en originalData
                if (metricName === 'Win %') {
                  console.log('PROPIEDADES DISPONIBLES PARA WIN %:', {
                    win_rate: originalData?.win_rate,
                    win_rate_no_be: originalData?.win_rate_no_be,
                    trading_wins: originalData?.trading_wins,
                    trading_losses: originalData?.trading_losses,
                    todasLasPropiedades: originalData
                  });
                }
                
                // Determinar qué valor mostrar según la métrica
                let displayValue;
                switch(metricName) {
                  case 'Win %':
                    // Calcular el porcentaje de victorias sin operaciones de breakeven
                    // Usar los valores exactos que vemos en la consola
                    const wins = originalData?.winning_trades || 0;
                    const losses = originalData?.losing_trades || 0;
                    const breakeven = originalData?.breakeven_trades || 0;
                    const totalWL = wins + losses;
                    const winRate = totalWL > 0 ? (wins / totalWL) * 100 : 0;
                    displayValue = `${winRate.toFixed(2)}%`;
                    break;
                  case 'Profit factor':
                    displayValue = originalData?.profit_factor?.toFixed(2) || "0.00";
                    break;
                  case 'Avg win/loss':
                    const avgWinLoss = originalData?.avg_win && originalData?.avg_loss ? 
                      (originalData.avg_win / (Math.abs(originalData.avg_loss) || 1)) : 0;
                    displayValue = avgWinLoss.toFixed(2);
                    break;
                  case 'Recovery factor':
                    const recoveryFactor = originalData?.max_drawdown && originalData?.max_drawdown > 0 && originalData?.net_profit !== undefined ? 
                      (originalData.net_profit / originalData.max_drawdown) : 0;
                    displayValue = recoveryFactor.toFixed(2);
                    break;
                  case 'Max drawdown':
                    displayValue = `${originalData?.max_drawdown_percent?.toFixed(2) || "0.00"}%`;
                    break;
                  case 'Consistency':
                    displayValue = `${originalData?.day_win_rate?.toFixed(2) || "0.00"}%`;
                    break;
                  default:
                    displayValue = value;
                }
                
                return [displayValue, metricName];
              }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px'
              }}
              labelStyle={{
                color: '#333',
                fontWeight: 'bold'
              }}
              itemStyle={{
                color: '#666'
              }}
            />
            <Radar 
              name="Trader Performance" 
              dataKey="value" 
              stroke="#6366F1" 
              fill="#818CF8" 
              fillOpacity={0.4}
              dot={{ 
                fill: 'white', 
                stroke: '#6366F1', 
                strokeWidth: 2, 
                r: 5 
              }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-700 uppercase">ZELLA SCORE</h3>
          <div className="text-4xl font-bold text-gray-800">{zellaScore.toFixed(2)}</div>
        </div>
        
        {/* Barra de progreso con espacio para la escala */}
        <div className="mt-2 mb-8 relative">
          {/* Barra principal */}
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
            {/* Fondo con degradado */}
            <div className="absolute top-0 left-0 h-4 w-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 rounded-full"></div>
            
            {/* Marcador de posición */}
            <div 
              className="absolute top-0 flex items-center"
              style={{ 
                left: `${Math.min(98, zellaScore)}%`, 
                transform: 'translateX(-50%)'
              }}
            >
              <div className="h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-md"></div>
            </div>
          </div>
          
          {/* Numeración separada con espacio adecuado */}
          <div className="mt-5 w-full flex justify-between text-sm text-gray-700 font-medium">
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ZellaScoreRadar.displayName = 'ZellaScoreRadar';

export default ZellaScoreRadar; 