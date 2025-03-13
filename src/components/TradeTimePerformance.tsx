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

    // Filtrar trades válidos
    const validTrades = processedData.rawTrades.filter((trade: any) => {
      return trade && trade.time && trade.profit !== undefined;
    });

    // Log de diagnóstico en modo desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 TradeTimePerformance: Procesando ${validTrades.length} trades válidos`);
      if (validTrades.length > 0) {
        console.log('Ejemplo de trade:', validTrades[0]);
      }
    }

    // Convertir trades a puntos para el gráfico
    return validTrades.map((trade: any) => {
      try {
        // Normalizar el timestamp a un objeto Date
        let date;
        if (typeof trade.time === 'number') {
          // Si es timestamp en segundos, convertir a milisegundos
          const timestamp = trade.time > 10000000000 ? trade.time : trade.time * 1000;
          date = new Date(timestamp);
        } else {
          // Si es string, parsear directamente
          date = new Date(trade.time);
        }

        // Debug log
        if (process.env.NODE_ENV === 'development') {
          console.log('Processing trade:', {
            originalTime: trade.time,
            parsedDate: date.toISOString(),
            hour: date.getHours(),
            minutes: date.getMinutes()
          });
        }

        // Ajustar al año actual si es necesario
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
    }).filter(point => point !== null) as TradePoint[];
  }, [processedData?.rawTrades]);

  // Añadir log de diagnóstico
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.group('🔍 DEBUG TRADE TIME PERFORMANCE');
    console.log(`Total de puntos para gráfico: ${tradePoints.length}`);
    
    if (tradePoints.length > 0) {
      console.log('Muestra de trades procesados:');
      tradePoints.slice(0, 5).forEach((point: TradePoint) => {
        console.log({
          hour: point.hour,
          formattedTime: format(point.timestamp, 'HH:mm:ss'),
          profit: point.profit,
          symbol: point.symbol,
          ticket: point.ticket
        });
      });
    }
    
    // Analizar distribución por horas
    const hourDistribution = new Map<number, {count: number, profit: number}>();
    tradePoints.forEach((point: TradePoint) => {
      const hour = Math.floor(point.hour);
      if (!hourDistribution.has(hour)) {
        hourDistribution.set(hour, {count: 0, profit: 0});
      }
      const data = hourDistribution.get(hour)!;
      data.count++;
      data.profit += point.profit;
    });
    
    console.log('Distribución de trades por hora:');
    Array.from(hourDistribution.entries())
      .sort(([hourA], [hourB]) => hourA - hourB)
      .forEach(([hour, data]) => {
        console.log(`${hour}:00 - ${data.count} trades, P&L: $${data.profit.toFixed(2)}`);
      });
    
    // Verificar trades ganadores vs perdedores
    const winners = tradePoints.filter((point: TradePoint) => point.profit > 0);
    const losers = tradePoints.filter((point: TradePoint) => point.profit < 0);
    
    console.log(`Trades ganadores: ${winners.length} (${(winners.length / tradePoints.length * 100).toFixed(1)}%)`);
    console.log(`Trades perdedores: ${losers.length} (${(losers.length / tradePoints.length * 100).toFixed(1)}%)`);
    
    console.groupEnd();
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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Trade time performance</h2>
        <div className="text-sm text-gray-600">
          {tradePoints.length} trades
        </div>
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