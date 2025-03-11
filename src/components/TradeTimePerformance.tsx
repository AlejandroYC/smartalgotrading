// src/components/TradeTimePerformance.tsx
import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTradingData } from '@/contexts/TradingDataContext';

interface TradePoint {
  hour: number;
  profit: number;
  timestamp: number;
}

const TradeTimePerformance: React.FC = () => {
  const { processedData } = useTradingData();

  const tradePoints = useMemo(() => {
    if (!processedData?.rawTrades) return [];

    return processedData.rawTrades
      .filter((trade: any) => trade.time && trade.profit !== undefined)
      .map((trade: any) => {
        const date = new Date(
          typeof trade.time === 'string' 
            ? trade.time 
            : trade.time > 10000000000 
              ? trade.time 
              : trade.time * 1000
        );
        
        return {
          hour: date.getHours() + (date.getMinutes() / 60),
          profit: Number(trade.profit),
          timestamp: date.getTime(),
        };
      });
  }, [processedData?.rawTrades]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm text-gray-500">
            {format(data.timestamp, 'MM/dd/yyyy HH:mm')}
          </p>
          <p className={`text-sm font-medium ${data.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${data.profit.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Trade time performance</h2>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 50, right: 20, bottom: 20, left: 0 }}
          >
            <XAxis
              type="number"
              dataKey="hour"
              name="Hora"
              domain={[0, 24]}
              tickCount={13}
              tickFormatter={(value) => `${Math.floor(value)}:00`}
            />
            <YAxis
              type="number"
              dataKey="profit"
              name="Profit"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="Trades ganadores"
              data={tradePoints.filter((point: TradePoint) => point.profit >= 0)}
              fill="#10B981"
            />
            <Scatter
              name="Trades perdedores"
              data={tradePoints.filter((point: TradePoint) => point.profit < 0)}
              fill="#EF4444"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradeTimePerformance;