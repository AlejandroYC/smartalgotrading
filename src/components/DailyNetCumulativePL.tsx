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
}

const DailyNetCumulativePL: React.FC<DailyNetCumulativePLProps> = ({ dailyResults }) => {
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
         <h1 className="text-2xl text-black font-bold text-left">Daily Net Cumulative P&L</h1>
      </div>
      <hr className="w-full border-t border-gray-200 mb-4 mt-6" />
    

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MM/dd/yy')}
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {format(parseISO(data.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cumulative P&L: <span className={data.value >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ${data.valueDisplay.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Daily P&L: <span className={data.dailyProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ${data.dailyProfitDisplay.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Trades: {data.trades}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#5b33ff"
              strokeWidth={1.8}
              fill="url(#colorValue)"
              fillOpacity={1}
              dot={false}
              activeDot={{
                r: 4,
                stroke: '#4ade80',
                strokeWidth: 2,
                fill: '#ffffff'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyNetCumulativePL; 