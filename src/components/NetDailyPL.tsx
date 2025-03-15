import React, { useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

interface NetDailyPLProps {
  dailyResults: Record<string, DailyResult>;
}

const NetDailyPL: React.FC<NetDailyPLProps> = ({ dailyResults }) => {
  // Calcular el total del P&L para verificación
  const totalPL = useMemo(() => {
    // Usar el método centralizado que accede directamente a la misma fuente que el calendario
    if (typeof (dailyResults as any).calculateTotalPL === 'function') {
      const calculatedPL = (dailyResults as any).calculateTotalPL();
      return calculatedPL;
    }
    
    // Si no está disponible, sumar directamente de los daily_results sin modificaciones
    const total = Object.values(dailyResults).reduce((sum, day) => {
      // Asegurarnos de que estamos sumando números, no strings
      const profit = typeof day.profit === 'string' ? parseFloat(day.profit) : day.profit;
      return sum + profit;
    }, 0);
    
    return total;
  }, [dailyResults]);

  // Añadimos un efecto para hacer logging de la información
  useEffect(() => {
    // Solo ejecutar en modo desarrollo
    if (process.env.NODE_ENV !== 'development') return;    
    if (typeof (dailyResults as any).verifyDailyResultsConsistency === 'function') {
      const consistency = (dailyResults as any).verifyDailyResultsConsistency();
    }
    
  }, [dailyResults]);

  const chartData = useMemo(() => {
    return Object.entries(dailyResults)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date,
        profit: Number(data.profit.toFixed(2))
      }));
  }, [dailyResults]);

  const maxProfit = Math.max(...chartData.map(d => d.profit));
  const minProfit = Math.min(...chartData.map(d => d.profit));
  const absMax = Math.max(Math.abs(maxProfit), Math.abs(minProfit));

  // Función para formatear valores del eje Y
  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Personalizar el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const profit = payload[0].value;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            {format(parseISO(label), 'MMM d, yyyy')}
          </p>
          <p className="text-sm text-gray-600">
            Net P&L: <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
              ${profit.toFixed(2)}
            </span>
          </p>
          {dailyResults[label] && (
            <p className="text-xs text-gray-500">
              {dailyResults[label].trades} trades
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl text-black font-bold text-left">Net Daily P&L
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </button>
        </h1>
        <div className="text-sm text-gray-500">
          Total: <span className={totalPL >= 0 ? 'text-green-500' : 'text-red-500'}>
            ${totalPL.toFixed(2)}
          </span>
        </div>
      </div>
      <hr className="w-full border-t border-gray-200 mb-4 mt-6" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            barGap={2}
            barCategoryGap={30}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MM/dd')}
              stroke="#6B7280"
              fontSize={12}
              tickMargin={10}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="#6B7280"
              fontSize={12}
              domain={[-(absMax * 1.1), (absMax * 1.1)]}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={0}
              stroke="#E5E7EB"
            />
            <Bar
              dataKey="profit"
              radius={0}
              maxBarSize={8}
            >
              {
                chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'}
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NetDailyPL;