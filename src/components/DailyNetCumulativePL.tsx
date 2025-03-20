import React, { useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import DashboardCardTitle from '@/components/DashboardCardTitle';

interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

interface DailyNetCumulativePLProps {
  dailyResults: Record<string, DailyResult>;
  height?: number;
}

const DailyNetCumulativePL: React.FC<DailyNetCumulativePLProps> = ({ 
  dailyResults,
  height = 300 
}) => {
  const chartData = useMemo(() => {
    if (!dailyResults || Object.keys(dailyResults).length === 0) {
      return [];
    }

    // IMPORTANTE: Para evitar problemas de redondeo, mantenemos la precisión completa durante los cálculos
    // y sólo redondeamos al final para la visualización
    let cumulativeProfit = 0;
    
    // Solo utilizar los resultados diarios directamente
    // Ordenados por fecha para calcular el acumulado correctamente
    return Object.entries(dailyResults)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => {
        // Asegurarnos de que profit es un número
        const profit = typeof data.profit === 'string' ? parseFloat(data.profit) : data.profit;
        
        // Acumular sin redondeo
        cumulativeProfit += profit;
        
        // Sólo redondear para visualización
        return {
          date,
          value: cumulativeProfit,
          valueDisplay: Number(cumulativeProfit.toFixed(2)),
          dailyProfit: profit,
          dailyProfitDisplay: Number(profit.toFixed(2)),
          trades: data.trades,
        };
      });
  }, [dailyResults]);

  // Log de diagnóstico solo en modo desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // Verificar si tenemos el método centralizado
    if (typeof (dailyResults as any).calculateTotalPL === 'function') {
      const centralTotal = (dailyResults as any).calculateTotalPL();

    }
    
    // Total calculado por el gráfico (último valor acumulado)
    if (chartData.length > 0) {
      Object.values(dailyResults).reduce((sum: number, day: any) => {
        const profit = typeof day.profit === 'string' ? parseFloat(day.profit) : day.profit;
        return sum + profit;
      }, 0).toFixed(2)
    }
    
  }, [dailyResults, chartData]);

  // Reducir la cantidad de ticks en el eje X
  const xAxisTicks = useMemo(() => {
    if (chartData.length <= 10) return undefined; // Usar todos los ticks si hay pocos datos
    
    // Tomar puntos distribuidos uniformemente
    const numTicks = Math.min(8, chartData.length); // Máximo 8 ticks
    const step = Math.ceil(chartData.length / numTicks);
    
    const ticks = [];
    for (let i = 0; i < chartData.length; i += step) {
      if (chartData[i]) {
        ticks.push(chartData[i].date);
      }
    }
    
    // Asegurar que el último punto está incluido
    if (chartData.length > 0 && !ticks.includes(chartData[chartData.length - 1].date)) {
      ticks.push(chartData[chartData.length - 1].date);
    }
    
    return ticks;
  }, [chartData]);

  // Determinar si hay inconsistencia (cambios entre positivo y negativo)
  const isInconsistent = useMemo(() => {
    if (chartData.length < 2) return false;
    
    let hasPositive = false;
    let hasNegative = false;
    
    for (const item of chartData) {
      if (item.value > 0) hasPositive = true;
      if (item.value < 0) hasNegative = true;
      if (hasPositive && hasNegative) return true;
    }
    
    return false;
  }, [chartData]);
  
  // Determinar el color final basado en el último valor
  const finalValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const chartMainColor = finalValue >= 0 ? "#22c55e" : "#ef4444";

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow h-full">
        
        <div className="h-full flex flex-col justify-center items-center">
          <DashboardCardTitle 
            title="Daily Net Cumulative P&L"
            showInfo={true}
          />
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-600">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const absMax = Math.max(Math.abs(maxValue), Math.abs(minValue));

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
       <div className="flex items-start justify-start mb-4">
         <h1 className="text-lg font-bold text-black font-roboto text-left">Daily Net Cumulative P&L</h1>
      </div>
      <hr className="w-full border-t border-gray-200 mb-4 mt-6" />
    

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#E2E8F0" 
            />
            <defs>
              {/* Gradiente para valores positivos (verde) */}
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
              
              {/* Gradiente para valores negativos (rojo) */}
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              
              {/* Gradiente para valores inconsistentes (amarillo-naranja) */}
              {isInconsistent && (
                <linearGradient id="inconsistentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              )}
            </defs>
            <XAxis
              dataKey="date"
              ticks={xAxisTicks}
              tickFormatter={(date) => {
                if (!date) return '';
                const parts = date.split('-');
                if (parts.length !== 3) return date;
                return `${parts[2]}/${parts[1]}`;
              }}
              stroke="#94A3B8"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              stroke="#94A3B8"
              fontSize={12}
            />
            <Tooltip
              formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, undefined]}
              labelFormatter={(date) => format(parseISO(date as string), 'MMM dd, yyyy')}
              contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{
                color: '#E2E8F0'
              }}
              labelStyle={{
                color: '#F8FAFC',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isInconsistent ? "#f59e0b" : chartMainColor}
              fill={isInconsistent ? "url(#inconsistentGradient)" : finalValue >= 0 ? "url(#positiveGradient)" : "url(#negativeGradient)"}
              fillOpacity={0.6}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const isPositive = payload.value >= 0;
                const dotColor = isPositive ? "#22c55e" : "#ef4444";
                
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    stroke={dotColor}
                    strokeWidth={2}
                    fill="#ffffff"
                  />
                );
              }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
            <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(DailyNetCumulativePL); 