// src/components/TradeTimePerformance.tsx
import React, { useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTradingData } from '@/contexts/TradingDataContext';

interface TradePoint {
  hour: number;
  profit: number;
  timestamp: number;
  symbol?: string;
  ticket?: number;
}

const TradeTimePerformance: React.FC = () => {
  const { processedData } = useTradingData();

  const tradePoints = useMemo(() => {
    if (!processedData?.rawTrades) return [];

    const validTrades = processedData.rawTrades.filter((trade: any) => {
      return trade && trade.time && trade.profit !== undefined;
    });

    return validTrades.map((trade: any) => {
      try {
        let date;
        if (typeof trade.time === 'number') {
          const timestamp = trade.time > 10000000000 ? trade.time : trade.time * 1000;
          date = new Date(timestamp);
        } else {
          date = new Date(trade.time);
        }

        const currentYear = new Date().getFullYear();
        if (date.getFullYear() > currentYear) {
          date.setFullYear(currentYear);
        }

        return {
          hour: date.getHours() + (date.getMinutes() / 60),
          profit: Number(trade.profit),
          timestamp: date.getTime(),
          symbol: trade.symbol,
          ticket: trade.ticket
        };
      } catch (error) {
        console.error('Error procesando trade:', error);
        return null;
      }
    }).filter((point: TradePoint | null) => point !== null) as TradePoint[];
  }, [processedData?.rawTrades]);

  const hourDistribution = useMemo(() => {
    const distribution = new Map<number, {count: number, profit: number}>();
    tradePoints.forEach((point: TradePoint) => {
      const hour = Math.floor(point.hour);
      if (!distribution.has(hour)) {
        distribution.set(hour, {count: 0, profit: 0});
      }
      const data = distribution.get(hour)!;
      data.count++;
      data.profit += point.profit;
    });
    return distribution;
  }, [tradePoints]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm text-gray-500">
            {format(data.timestamp, 'yyyy-MM-dd HH:mm')}
          </p>
          <p className={`text-sm font-medium ${data.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${data.profit.toFixed(2)}
          </p>
          {data.symbol && (
            <p className="text-xs text-gray-500">{data.symbol}</p>
          )}
          {data.ticket && (
            <p className="text-xs text-gray-500">Ticket: {data.ticket}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-[392px]   ">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-gray-900 p-[16px]">Rendimiento en el tiempo de operación</h2>
        <div className="text-sm text-gray-600">
          {tradePoints.length} trades
        </div>
      </div>
      <div className="w-[420px] max-h-[295px] p-4 overflow-hidden">
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
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