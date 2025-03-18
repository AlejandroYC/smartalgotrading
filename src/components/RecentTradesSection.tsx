import React, { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import EmptyStateCard from './EmptyStateCard';
import { useTradingData } from '@/contexts/TradingDataContext';
import { formatTradeType, isBuyOperation, isSellOperation } from '@/utils/tradeUtils';

interface Trade {
  ticket?: string | number;
  symbol?: string;
  type?: string;
  profit?: number;
  time?: string | number;
  commission?: number;
  swap?: number;
}

interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

const RecentTradesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trades');
  const { processedData, dateRange, positions } = useTradingData();
  
  // Procesar los trades usando useMemo para mejor rendimiento
  const tradesList = useMemo(() => {
    // Convertir las fechas del rango a inicio y fin del día para comparación precisa
    const rangeStart = startOfDay(dateRange.startDate);
    const rangeEnd = endOfDay(dateRange.endDate);
    
    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      return [];
    }

    // Función auxiliar para convertir cualquier formato de fecha a timestamp en milisegundos
    const getTimestamp = (time: string | number): number => {
      if (!time) return 0;
      
      try {
        if (typeof time === 'string') {
          return parseISO(time).getTime();
        } else {
          return time > 10000000000 ? time : time * 1000;
        }
      } catch (error) {
        console.error('Error convirtiendo fecha:', time, error);
        return 0;
      }
    };

    // Filtrar primero por trades válidos y con profit (closing deals)
    const validTrades = processedData.rawTrades.filter((trade: Trade) => 
      trade.ticket && 
      trade.symbol && 
      typeof trade.profit === 'number' && 
      trade.time &&
      trade.profit !== 0 // Solo trades cerrados con profit
    );



    // Filtrar por rango de fechas
    const filteredTrades = validTrades.filter((trade: Trade) => {
      try {
        // Ya sabemos que trade.time existe porque lo filtramos antes
        const timestamp = getTimestamp(trade.time!);
        const tradeDate = new Date(timestamp);

        if (isNaN(tradeDate.getTime())) {
          return false;
        }

        const isInRange = isWithinInterval(tradeDate, {
          start: rangeStart,
          end: rangeEnd
        });

      

        return isInRange;
      } catch (error) {
        console.error('Error procesando trade:', trade, error);
        return false;
      }
    });



    // Ordenar por fecha más reciente
    const sortedTrades = filteredTrades.sort((a: Trade, b: Trade) => {
      // Ya sabemos que los trades tienen time porque los filtramos antes
      const timeA = getTimestamp(a.time!);
      const timeB = getTimestamp(b.time!);
      return timeB - timeA;
    });

    // Tomar solo los primeros 50 trades
    const limitedTrades = sortedTrades.slice(0, 50);
  
    
    return limitedTrades;
  }, [processedData?.rawTrades, dateRange]);

  // Renderizar el contenido según el tab activo
  const renderContent = () => {
    if (activeTab === 'trades') {
      return tradesList.length > 0 ? (
        tradesList.map((trade: Trade) => (
          <div key={trade.ticket} className="px-6 py-4 text-black hover:bg-gray-50">
            <div className="grid grid-cols-4 text-sm">
              <div>
                {format(
                  typeof trade.time === 'string' 
                    ? new Date(trade.time) 
                    : new Date(Number(trade.time) * 1000),
                  'MM/dd/yyyy HH:mm'
                )}
              </div>
              <div>{trade.symbol}</div>
              <div>
                <span className={`
                  px-2 py-1 rounded-full text-xs 
                  ${isBuyOperation(trade.type) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'}
                `}>
                  {formatTradeType(trade.type)}
                </span>
              </div>
              <div className={`text-right ${
                (trade.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                ${(trade.profit || 0).toFixed(2)}
              </div>
            </div>
          </div>
        ))
      ) : (
        <EmptyStateCard 
          icon="trades"
          message={`No hay operaciones en el período ${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`}
        />
      );
    } else {
      // Mostrar posiciones abiertas
      return positions.length > 0 ? (
        positions.map((position) => (
          <div key={position.ticket} className="px-6 py-4 text-black hover:bg-gray-50">
            <div className="grid grid-cols-4 text-sm">
              <div>
                {format(
                  typeof position.openTime === 'string' 
                    ? new Date(position.openTime) 
                    : new Date(Number(position.openTime) * 1000),
                  'MM/dd/yyyy HH:mm'
                )}
              </div>
              <div>{position.symbol}</div>
              <div>{position.type}</div>
              <div className={`text-right ${
                (position.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                ${(position.profit || 0).toFixed(2)}
              </div>
            </div>
          </div>
        ))
      ) : (
        <EmptyStateCard 
          icon="cards"
          message="No hay posiciones abiertas"
        />
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex gap-6 border-b">
        <button 
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'trades' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('trades')}
        >
          RECENT TRADES
        </button>
        <button 
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'positions' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('positions')}
        >
          OPEN POSITIONS
        </button>
      </div>

      {/* Table Headers */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-4 text-xs font-medium text-gray-500">
          {activeTab === 'trades' ? (
            <>
          <div>Close Date</div>
          <div>Symbol</div>
              <div>Type</div>
          <div className="text-right">Net P&L</div>
            </>
          ) : (
            <>
              <div>Open Date</div>
              <div>Symbol</div>
              <div>Type</div>
              <div className="text-right">Floating P&L</div>
            </>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-gray-200 max-h-[400px] overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default RecentTradesSection;  