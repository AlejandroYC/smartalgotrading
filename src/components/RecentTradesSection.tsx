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

interface Position {
  ticket?: string | number;
  symbol?: string;
  type?: string | number;
  volume?: number;
  time?: string | number;  // Agregar time como alternativa a openTime
  openTime?: string | number;
  openPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
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

  // Función de ayuda para convertir fechas de forma segura
  const safeFormatDate = (dateValue: string | number | undefined): string => {
    if (!dateValue) return 'N/A';
    
    try {
      let timestamp: number;
      
      // Convertir el valor a timestamp
      if (typeof dateValue === 'string') {
        // Intentar parsear como fecha ISO primero
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          timestamp = parsedDate.getTime();
        } else {
          // Si no es una fecha ISO válida, intentar como número
          timestamp = parseInt(dateValue, 10);
          // Si es un timestamp en segundos, convertir a milisegundos
          if (timestamp < 10000000000) timestamp *= 1000;
        }
      } else {
        timestamp = dateValue;
        // Si es un timestamp en segundos, convertir a milisegundos
        if (timestamp < 10000000000) timestamp *= 1000;
      }

      const date = new Date(timestamp);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', { dateValue, timestamp });
        return 'Fecha inválida';
      }
      
      // Log para diagnóstico
      console.log('Procesando fecha:', {
        original: dateValue,
        timestamp,
        date: date.toISOString(),
        formatted: format(date, 'MM/dd/yyyy HH:mm')
      });
      
      return format(date, 'MM/dd/yyyy HH:mm');
    } catch (error) {
      console.error('Error formateando fecha:', { dateValue, error });
      return 'Error en fecha';
    }
  };

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
        positions.map((position) => {
          // Log para diagnóstico de cada posición
          console.log('Datos de posición:', {
            ticket: position.ticket,
            openTime: position.openTime,
            type: position.type,
            symbol: position.symbol
          });

          // Intentar obtener la fecha actual si no hay openTime
          const currentTime = new Date().toISOString();

          return (
            <div key={position.ticket} className="px-6 py-4 text-black hover:bg-gray-50">
              <div className="grid grid-cols-4 text-sm">
                <div>{position.openTime ? safeFormatDate(position.openTime) : format(new Date(), 'MM/dd/yyyy HH:mm')}</div>
                <div>{position.symbol || 'N/A'}</div>
                <div>
                  <span className={`
                    px-2 py-1 rounded-full text-xs 
                    ${isBuyOperation(position.type) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'}
                  `}>
                    {formatTradeType(position.type)}
                  </span>
                </div>
                <div className={`text-right ${
                  (position.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  ${(position.profit || 0).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <EmptyStateCard 
          icon="cards"
          message="No hay posiciones abiertas"
        />
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-[392px]">
      <div className="flex gap-6 border-b">
        <button 
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'trades' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('trades')}
        >
          OPERACIONES RECENTES
        </button>
        <button 
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'positions' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('positions')}
        >
          POSICIONES ABIERTAS
        </button>
      </div>

      {/* Table Headers */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-4 text-xs font-medium text-gray-500">
          {activeTab === 'trades' ? (
            <>
          <div>Fecha de cierre</div>
          <div>Símbolo</div>
              <div>Tipo</div>
          <div className="text-right">P&L neto</div>
            </>
          ) : (
            <>
              <div>Fecha de apertura</div>
              <div>Símbolo</div>
              <div>Tipo</div>
              <div className="text-right">P&L flotante</div>
            </>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-gray-200 max-h-[280px] overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default RecentTradesSection;  