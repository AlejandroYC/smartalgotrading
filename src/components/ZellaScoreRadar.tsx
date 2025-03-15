'use client';
import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import EmptyStateCard from './EmptyStateCard';
import { useTradingData } from '@/contexts/TradingDataContext';

interface ZellaMetric {
  name: string;
  value: number;
  description: string;
}

interface ZellaScoreProps {
  className?: string;
}

const ZellaScoreRadar: React.FC<ZellaScoreProps> = ({ className = '' }) => {
  // Usar el contexto en lugar de props
  const { processedData, loading } = useTradingData();
  
  // Verificar si hay suficientes datos para mostrar
  const hasTrades = processedData?.total_trades > 0;

  // Calcular métricas para el Zella Score
  const calculateMetrics = (): ZellaMetric[] => {
    if (!processedData) return [];

    // Normalizar valores entre 0-5 para el radar
    const normalizeValue = (value: number, min: number, max: number, defaultValue = 0): number => {
      if (value === undefined || value === null || isNaN(value)) return defaultValue;
      // Asegurar que está entre min y max, luego convertir a escala 0-5
      const normalized = Math.max(min, Math.min(max, value));
      return ((normalized - min) / (max - min)) * 5;
    };

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
  };

  const metrics = calculateMetrics();
  
  // Calcular el Zella Score basado en las métricas
  const calculateZellaScore = (): number => {
    if (!hasTrades || !metrics.length) return 0;
    
    // Pesos para cada métrica (ajustar según importancia)
    const weights = {
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
  };

  const zellaScore = calculateZellaScore();
  
  // Formato para el radar chart
  const formattedData = metrics.map(metric => ({
    subject: metric.name,
    value: metric.value,
    fullMark: 5,
  }));

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
          icon="chart" 
          message="Available once there is at least 1 trade."
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start justify-start">
          <h1 className="text-3xl text-black font-bold text-left">Zella Score</h1>
        </div>

        <div className="flex items-center">
          <span className="text-3xl font-bold text-indigo-600">{zellaScore.toFixed(2)}</span>
          <div className="ml-2 flex h-2 w-24 rounded-full bg-gray-200">
            <div 
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${Math.min(100, zellaScore)}%` }}
            />
          </div>
        </div>
      </div>
      <hr className="w-full border-t border-gray-200 mb-4" />

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius="80%" data={formattedData}>
            <PolarGrid 
              gridType="polygon"
              strokeDasharray="3 3" 
              stroke="#E5E7EB"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Radar
              name="Trader Performance"
              dataKey="value"
              stroke="#4F46E5"
              fill="#818CF8"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div 
            key={metric.name}
            className="flex items-center p-2 rounded hover:bg-gray-50"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-700">{metric.name}</p>
              <p className="text-xs text-gray-500">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZellaScoreRadar; 