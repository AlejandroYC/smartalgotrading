'use client';
import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis
} from 'recharts';
import EmptyStateCard from './EmptyStateCard';
import { useTradingData } from '@/contexts/TradingDataContext';

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
const normalizeValue = (value: number, min: number, max: number, defaultValue = 0): number => {
  if (value === undefined || value === null || isNaN(value)) return defaultValue;
  // Asegurar que está entre min y max, luego convertir a escala 0-5
  const normalized = Math.max(min, Math.min(max, value));
  return ((normalized - min) / (max - min)) * 5;
};

const ZellaScoreRadar: React.FC<ZellaScoreProps> = React.memo(({ className = '' }) => {
  // Usar el contexto en lugar de props
  const { processedData, loading } = useTradingData();
  
  // Verificar si hay suficientes datos para mostrar - memoizado para estabilidad
  const hasTrades = useMemo(() => processedData?.total_trades > 0, [processedData?.total_trades]);

  // Calcular métricas para el Zella Score - memoizado para evitar cálculos repetidos
  const metrics: ZellaMetric[] = useMemo(() => {
    if (!processedData) return [];

    return [
      {
        name: 'Win %',
        value: normalizeValue(processedData.win_rate, 0, 100, 0),
        description: 'Porcentaje de operaciones ganadoras'
      },
      {
        name: 'Profit factor',
        value: normalizeValue(processedData.profit_factor, 0, 3, 0),
        description: 'Relación entre ganancias y pérdidas'
      },
      {
        name: 'Avg win/loss',
        value: normalizeValue(
          processedData.avg_win / (Math.abs(processedData.avg_loss) || 1), 
          0, 3, 0
        ),
        description: 'Proporción promedio de ganancia/pérdida'
      },
      {
        name: 'Recovery factor',
        value: normalizeValue(
          processedData.net_profit / (processedData.max_drawdown || 1),
          0, 5, 0
        ),
        description: 'Capacidad de recuperación de drawdowns'
      },
      {
        name: 'Max drawdown',
        // Invertido porque menor drawdown es mejor
        value: normalizeValue(
          processedData.max_drawdown_percent ? (100 - processedData.max_drawdown_percent) : 50,
          0, 100, 2.5
        ),
        description: 'Máxima pérdida desde máximos'
      },
      {
        name: 'Consistency',
        value: normalizeValue(processedData.day_win_rate, 0, 100, 0),
        description: 'Estabilidad en los resultados'
      },
    ];
  }, [processedData]);
  
  // Calcular el Zella Score basado en las métricas - memoizado para estabilidad
  const zellaScore = useMemo(() => {
    if (!hasTrades || !metrics.length) return 0;
    
    // Pesos para cada métrica (ajustar según importancia)
    const weights: { [key: string]: number } = {
      'Win %': 0.20,
      'Profit factor': 0.25,
      'Avg win/loss': 0.15,
      'Recovery factor': 0.15,
      'Max drawdown': 0.15,
      'Consistency': 0.10,
    };
    
    // Calcular suma ponderada
    let weightedSum = 0;
    let totalWeight = 0;
    
    metrics.forEach(metric => {
      const weight = weights[metric.name] || 0;
      weightedSum += metric.value * weight;
      totalWeight += weight;
    });
    
    // Normalizar a escala 0-100
    return (weightedSum / totalWeight) * 20;
  }, [hasTrades, metrics]);
  
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
              strokeOpacity={0.4} 
            />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#818CF8', fontSize: 14, opacity: 0.9 }}
              axisLine={false}
            />
            <PolarRadiusAxis 
              domain={[0, 5]} 
              tick={false} 
              axisLine={false}
              tickCount={6}
              stroke="#A5B4FC"
              opacity={0.6}
            />
            <Radar 
              name="Trader Performance" 
              dataKey="value" 
              stroke="#818CF8" 
              fill="#818CF8" 
              fillOpacity={0.6}
              dot={{ 
                fill: 'white', 
                stroke: '#818CF8', 
                strokeWidth: 2, 
                r: 4 
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