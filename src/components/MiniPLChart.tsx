import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine,
  YAxis,
  Tooltip,
  XAxis
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface MiniPLChartProps {
  data: Array<{
    time: string;
    value: number;
  }>;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    const value = payload[0].value;
    const date = parseISO(label);
    
    return (
      <div className="bg-gray-900 bg-opacity-90 p-2 rounded shadow-lg text-white text-xs">
        <p className="font-medium">{format(date, 'dd/MM/yyyy')}</p>
        <p className={value >= 0 ? 'text-green-400' : 'text-red-400'}>
          ${value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const MiniPLChart: React.FC<MiniPLChartProps> = ({ data, height = 57 }) => {
  // Determinar el dominio del eje Y
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const absMax = Math.max(Math.abs(maxValue), Math.abs(minValue));
  const domain = [-absMax * 1.1, absMax * 1.1];

  // Procesar los datos para separar valores positivos y negativos
  const processedData = data.map(item => ({
    ...item,
    positiveValue: item.value >= 0 ? item.value : undefined,
    negativeValue: item.value < 0 ? item.value : undefined
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={processedData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Gradiente para valores positivos */}
            <linearGradient id="miniPositiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
            {/* Gradiente para valores negativos */}
            <linearGradient id="miniNegativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="time"
            hide={true}
          />
          
          <YAxis 
            domain={domain}
            hide={true}
          />
          
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: '#9ca3af',
              strokeWidth: 1,
              strokeDasharray: '3 3'
            }}
          />
          
          <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
          
          {/* Área para valores positivos */}
          <Area
            type="monotone"
            dataKey="positiveValue"
            stroke="#22c55e"
            fill="url(#miniPositiveGradient)"
            strokeWidth={1.5}
            isAnimationActive={false}
            dot={false}
            activeDot={{
              r: 4,
              fill: '#22c55e',
              stroke: '#ffffff',
              strokeWidth: 2
            }}
            connectNulls={true}
          />
          
          {/* Área para valores negativos */}
          <Area
            type="monotone"
            dataKey="negativeValue"
            stroke="#ef4444"
            fill="url(#miniNegativeGradient)"
            strokeWidth={1.5}
            isAnimationActive={false}
            dot={false}
            activeDot={{
              r: 4,
              fill: '#ef4444',
              stroke: '#ffffff',
              strokeWidth: 2
            }}
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniPLChart; 