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

interface Position {
  ticket?: string | number;
  symbol?: string;
  type?: string | number;
  volume?: number;
  time?: string | number;
  openTime?: string | number;
  openPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
}

const RecentTradesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trades'|'positions'>('trades');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const { processedData, dateRange, positions } = useTradingData();
  
  const tradesList = useMemo(() => {
    const rangeStart = startOfDay(dateRange.startDate);
    const rangeEnd = endOfDay(dateRange.endDate);
    
    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      return [];
    }

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

    const validTrades = processedData.rawTrades.filter((trade: Trade) => 
      trade.ticket && 
      trade.symbol && 
      typeof trade.profit === 'number' && 
      trade.time &&
      trade.profit !== 0
    );

    const filteredTrades = validTrades.filter((trade: Trade) => {
      try {
        const timestamp = getTimestamp(trade.time!);
        const tradeDate = new Date(timestamp);

        if (isNaN(tradeDate.getTime())) {
          return false;
        }

        return isWithinInterval(tradeDate, {
          start: rangeStart,
          end: rangeEnd
        });
      } catch (error) {
        console.error('Error procesando trade:', trade, error);
        return false;
      }
    });

    const sortedTrades = filteredTrades.sort((a: Trade, b: Trade) => {
      const timeA = getTimestamp(a.time!);
      const timeB = getTimestamp(b.time!);
      return timeB - timeA;
    });

    return sortedTrades.slice(0, 50);
  }, [processedData?.rawTrades, dateRange]);

  const safeFormatDate = (dateValue: string | number | undefined): string => {
    if (!dateValue) return 'N/A';
    
    try {
      let timestamp: number;
      
      if (typeof dateValue === 'string') {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          timestamp = parsedDate.getTime();
        } else {
          timestamp = parseInt(dateValue, 10);
          if (timestamp < 10000000000) timestamp *= 1000;
        }
      } else {
        timestamp = dateValue;
        if (timestamp < 10000000000) timestamp *= 1000;
      }

      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', { dateValue, timestamp });
        return 'Fecha inválida';
      }
      
      return format(date, 'MM/dd/yyyy HH:mm');
    } catch (error) {
      console.error('Error formateando fecha:', { dateValue, error });
      return 'Error en fecha';
    }
  };

  const renderContent = () => {
    if (activeTab === 'trades') {
      return tradesList.length > 0 ? (
        tradesList.map((trade: Trade) => (
          <div key={trade.ticket} className="px-4 sm:px-6 py-3 sm:py-4 text-black hover:bg-gray-50">
            <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm">
              <div className="truncate">{safeFormatDate(trade.time)}</div>
              <div className="font-bold truncate">{trade.symbol}</div>
              <div>
                <span className={`
                  px-2 py-1 rounded-full text-xs 
                  ${isBuyOperation(trade.type) 
                    ? 'text-green-500' 
                    : 'text-red-500'}
                `}>
                  {formatTradeType(trade.type)}
                </span>
              </div>
              <div className={`text-right truncate ${
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
      return positions.length > 0 ? (
        positions.map((position) => (
          <div key={position.ticket} className="px-4 sm:px-6 py-3 sm:py-4 text-black hover:bg-gray-50">
            <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm">
              <div className="truncate">{position.openTime ? safeFormatDate(position.openTime) : format(new Date(), 'MM/dd/yyyy HH:mm')}</div>
              <div className="truncate">{position.symbol || 'N/A'}</div>
              <div>
                <span className={`
                  px-2 py-1 rounded-full text-xs 
                  ${isBuyOperation(position.type) 
                    ? 'bg-green-100 text-green-500' 
                    : 'bg-red-100 text-red-500'}
                `}>
                  {formatTradeType(position.type)}
                </span>
              </div>
              <div className={`text-right truncate ${
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

  // Componente interno: modal de selección de columnas
  const ColumnSelectorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
          <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-medium text-gray-800">Select columns</h2>
              <p className="text-sm text-gray-500">Choose the columns you want to display in the table</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
          </header>
          
          {/* Botones All/None/Default */}
          <div className="px-4 sm:px-6 py-3 border-b flex gap-4">
            <button className="text-sm text-purple-600 hover:text-purple-700">All</button>
            <button className="text-sm text-purple-600 hover:text-purple-700">None</button>
            <button className="text-sm text-purple-600 hover:text-purple-700">Default</button>
          </div>
          
          {/* Lista de columnas responsive */}
          <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              'Account name', 'Adjusted cost', 'Adjusted proceeds', 'Average entry',
              'Average exit', 'Best exit (%)', 'Best exit P&L', 'Best exit price',
              'Best exit time', 'Close date', 'Close time', 'Commissions',
              'Duration', 'Entrdas', 'Entry price', 'Errores',
              'Executions', 'Exit price', 'Gross P&L', 'Initial risk',
              'Initial target', 'Instrument', 'Instrument type', 'Net P&L',
              'Net ROI', 'Notes', 'Open date', 'Open time',
              'Pips', 'Planned R Multiple', 'Playbook', 'Points',
              'Position MAE', 'Position MFE', 'Price MAE', 'Price MFE',
              'Realized R Multiple', 'Return per pip', 'Reviewed', 'Side',
              'Status', 'Symbol', 'Ticks', 'Ticks per contract',
              'Total fees', 'Total swap', 'Trade rating', 'Volume',
              'Zella Insights', 'Zella Scale'
            ].map((column) => (
              <label key={column} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  defaultChecked={column === 'Close date'}
                />
                <span className="text-xs sm:text-sm text-black truncate">{column}</span>
              </label>
            ))}
          </div>

          <footer className="flex flex-col sm:flex-row justify-end px-4 sm:px-6 py-4 border-t gap-2">
            <button onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 w-full sm:w-auto">
              Cancel
            </button>
            <button onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full sm:w-auto">
              Update
            </button>
          </footer>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md max-h-[632px] flex flex-col py-2 sm:py-4">
      {/* Header con botones */}
      <div className="flex items-center justify-end px-4 sm:px-6 border-b h-12 sm:h-14">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Botón de settings que abre el modal */}
          <button
            onClick={() => setShowColumnModal(true)}
            className="border border-gray-300 p-1 sm:p-2 rounded-md hover:bg-gray-50"
            aria-label="Column settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
              <path d="M8.00039 9.60039C8.88405 9.60039 9.60039 8.88405 9.60039 8.00039C9.60039 7.11673 8.88405 6.40039 8.00039 6.40039C7.11673 6.40039 6.40039 7.11673 6.40039 8.00039C6.40039 8.88405 7.11673 9.60039 8.00039 9.60039Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M11.7677 9.52766C11.6999 9.68121 11.6797 9.85154 11.7096 10.0167C11.7396 10.1818 11.8183 10.3342 11.9357 10.4542L11.9662 10.4848C12.0609 10.5793 12.136 10.6916 12.1872 10.8152C12.2385 10.9388 12.2648 11.0713 12.2648 11.2051C12.2648 11.3389 12.2385 11.4714 12.1872 11.595C12.136 11.7186 12.0609 11.8309 11.9662 11.9255C11.8716 12.0201 11.7594 12.0952 11.6357 12.1465C11.5121 12.1977 11.3797 12.2241 11.2458 12.2241C11.112 12.2241 10.9795 12.1977 10.8559 12.1465C10.7323 12.0952 10.62 12.0201 10.5255 11.9255L10.4949 11.8949C10.375 11.7776 10.2226 11.6988 10.0574 11.6689C9.89227 11.639 9.72194 11.6592 9.56839 11.7269C9.41782 11.7915 9.2894 11.8986 9.19895 12.0352C9.10849 12.1718 9.05995 12.3318 9.0593 12.4957V12.5822C9.0593 12.8522 8.95203 13.1112 8.76108 13.3022C8.57014 13.4931 8.31116 13.6004 8.04112 13.6004C7.77108 13.6004 7.5121 13.4931 7.32116 13.3022C7.13021 13.1112 7.02294 12.8522 7.02294 12.5822V12.5364C7.01899 12.3679 6.96445 12.2045 6.8664 12.0674C6.76834 11.9303 6.63131 11.8258 6.47312 11.7677C6.31957 11.6999 6.14924 11.6797 5.98409 11.7096C5.81894 11.7396 5.66655 11.8183 5.54657 11.9357L5.51603 11.9662C5.42147 12.0609 5.30917 12.136 5.18557 12.1872C5.06196 12.2385 4.92947 12.2648 4.79566 12.2648C4.66186 12.2648 4.52937 12.2385 4.40576 12.1872C4.28216 12.136 4.16986 12.0609 4.0753 11.9662C3.98063 11.8716 3.90553 11.7594 3.85429 11.6357C3.80305 11.5121 3.77668 11.3797 3.77668 11.2458C3.77668 11.112 3.80305 10.9795 3.85429 10.8559C3.90553 10.7323 3.98063 10.62 4.0753 10.5255L4.10585 10.4949C4.22321 10.375 4.30194 10.2226 4.33188 10.0574C4.36183 9.89227 4.34161 9.72194 4.27385 9.56839C4.20931 9.41782 4.10216 9.2894 3.96557 9.19895C3.82899 9.10849 3.66894 9.05995 3.50512 9.0593H3.41857C3.14853 9.0593 2.88956 8.95203 2.69861 8.76108C2.50766 8.57014 2.40039 8.31116 2.40039 8.04112C2.40039 7.77108 2.50766 7.5121 2.69861 7.32116C2.88956 7.13021 3.14853 7.02294 3.41857 7.02294H3.46439C3.6329 7.01899 3.79632 6.96445 3.93342 6.8664C4.07051 6.76834 4.17494 6.63131 4.23312 6.47312C4.30089 6.31957 4.3211 6.14924 4.29116 5.98409C4.26121 5.81894 4.18248 5.66655 4.06512 5.54657L4.03457 5.51603C3.93991 5.42147 3.86481 5.30917 3.81357 5.18557C3.76233 5.06196 3.73595 4.92947 3.73595 4.79566C3.73595 4.66186 3.76233 4.52937 3.81357 4.40576C3.86481 4.28216 3.93991 4.16986 4.03457 4.0753C4.12913 3.98063 4.24143 3.90553 4.36503 3.85429C4.48864 3.80305 4.62113 3.77668 4.75494 3.77668C4.88874 3.77668 5.02123 3.80305 5.14484 3.85429C5.26844 3.90553 5.38074 3.98063 5.4753 4.0753L5.50585 4.10585C5.62583 4.22321 5.77822 4.30194 5.94336 4.33188C6.10851 4.36183 6.27884 4.34161 6.43239 4.27385H6.47312C6.62369 4.20931 6.75211 4.10216 6.84256 3.96557C6.93301 3.82899 6.98156 3.66894 6.98221 3.50512V3.41857C6.98221 3.14853 7.08948 2.88956 7.28043 2.69861C7.47137 2.50766 7.73035 2.40039 8.00039 2.40039C8.27043 2.40039 8.52941 2.50766 8.72036 2.69861C8.91131 2.88956 9.01858 3.14853 9.01858 3.41857V3.46439C9.02253 3.6329 9.07708 3.79632 9.17514 3.93342C9.27319 4.07051 9.41022 4.17494 9.56841 4.23312C9.72196 4.30089 9.89229 4.3211 10.0574 4.29116C10.2226 4.26121 10.375 4.18248 10.4949 4.06512L10.5255 4.03457C10.6201 3.93991 10.7323 3.86481 10.8559 3.81357C10.9795 3.76233 11.112 3.73595 11.2458 3.73595C11.3796 3.73595 11.5121 3.76233 11.6357 3.81357C11.7593 3.86481 11.8716 3.93991 11.9662 4.03457C12.0609 4.12913 12.136 4.24143 12.1872 4.36503C12.2385 4.48864 12.2648 4.62113 12.2648 4.75494C12.2648 4.88874 12.2385 5.02123 12.1872 5.14484C12.136 5.26844 12.0609 5.38074 11.9662 5.4753L11.9357 5.50585C11.8183 5.62583 11.7396 5.77822 11.7096 5.94336C11.6797 6.10851 11.6999 6.27884 11.7677 6.43239V6.47312C11.8323 6.62369 11.9394 6.75211 12.076 6.84256C12.2126 6.93301 12.3726 6.98156 12.5365 6.98221H12.623C12.893 6.98221 13.152 7.08948 13.343 7.28043C13.534 7.47137 13.6413 7.73035 13.6413 8.00039C13.6413 8.27043 13.534 8.52941 13.343 8.72036C13.152 8.91131 12.893 9.01858 12.623 9.01858H12.5772C12.4087 9.02253 12.2453 9.07708 12.1082 9.17514C11.9711 9.27319 11.8666 9.41022 11.8085 9.56841Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>

          <div className="relative">
            <button className="border text-[#adadad] border-gray-300 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm rounded-md flex items-center gap-1 hover:bg-gray-50">
              Bulk actions
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table Headers */}
      <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200 bg-gray-100">
        <div className="grid grid-cols-4 text-xs font-medium text-gray-500">
          <div className="truncate">Fecha</div>
          <div className="truncate">Símbolo</div>
          <div className="truncate">Tipo</div>
          <div className="text-right truncate">P&L</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-2 sm:pr-4">
          <div className="divide-y divide-gray-200">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Paginación responsive */}
      <div className="border-t border-gray-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
  <div className="flex items-center">
    <span className="text-xs sm:text-sm text-gray-600 mr-1 sm:mr-2">Trades per page</span>
    <div className="relative">
      <select className="appearance-none bg-white border border-gray-300 rounded-md pl-2 sm:pl-3 pr-6 py-1 text-xs sm:text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option>80</option>
        <option>50</option>
        <option>30</option>
        <option>10</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-gray-500">
        <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
  <span className="text-xs sm:text-sm text-gray-600 truncate">1 - 50 of 328 trades</span>
</div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto justify-between sm:justify-normal">
          {/* Página actual como dropdown */}
          <div className="relative">
            <select
              className="appearance-none border border-gray-300 text-xs sm:text-sm text-gray-800 rounded-md py-1 pl-1 sm:pl-2 pr-5 sm:pr-6 focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue="1"
            >
              {Array.from({ length: 7 }, (_, i) => (
                <option key={i} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            {/* Flecha hacia abajo */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-0 sm:pr-1 text-gray-500">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Texto "of X pages" */}
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">of 7 pages</span>

          {/* Línea divisoria */}
          <div className="h-4 sm:h-5 border-l border-gray-300 mx-1"></div>

          {/* Botón Anterior */}
          <button
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
            disabled
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Botón Siguiente */}
          <button className="p-1 rounded-md hover:bg-gray-100">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal de selección de columnas */}
      {showColumnModal && <ColumnSelectorModal onClose={() => setShowColumnModal(false)} />}
    </div>
  );
};

export default RecentTradesSection;