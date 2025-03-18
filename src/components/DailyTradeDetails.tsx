'use client';
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Trade } from '@/types/Trade';  // Asumiendo que existe este tipo o crear una interfaz
import { formatTradeType, isBuyOperation, isSellOperation } from '@/utils/tradeUtils';

interface DailyTradeDetailsProps {
  selectedDay: string;
  trades: Trade[];
  onClose: () => void;
}

const DailyTradeDetails: React.FC<DailyTradeDetailsProps> = ({
  selectedDay,
  trades,
  onClose
}) => {
  // Optimizar la generación del título a partir de la fecha seleccionada
  const formattedDate = useMemo(() => {
    try {
      // Parsear la fecha seleccionada a un objeto Date
      const dateObj = new Date(selectedDay);
      
      // Formatear usando el locale español para mostrar correctamente el mes
      return format(dateObj, "d 'de' MMMM yyyy", { locale: es });
    } catch (error) {
      console.error("Error formateando fecha para título:", error);
      return selectedDay; // Como fallback, mostrar la fecha tal cual
    }
  }, [selectedDay]);

  // Calcular estadísticas basadas únicamente en las operaciones proporcionadas
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Calcular ganancias/pérdidas totales usando solo las operaciones recibidas
    const totalProfit = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    
    // Contar operaciones ganadoras y perdedoras
    const winningTrades = trades.filter(trade => trade.profit > 0);
    const losingTrades = trades.filter(trade => trade.profit < 0);
    
    // Calcular promedios
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length
      : 0;
    
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0)) / losingTrades.length
      : 0;
    
    return {
      totalProfit,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      avgWin,
      avgLoss
    };
  }, [trades]);

  // Agrupar operaciones por símbolo
  const symbolStats = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    // Agrupar por símbolo
    const symbolMap: { [symbol: string]: { trades: number, profit: number } } = {};
    
    trades.forEach(trade => {
      const symbol = trade.symbol || 'Desconocido';
      if (!symbolMap[symbol]) {
        symbolMap[symbol] = { trades: 0, profit: 0 };
      }
      symbolMap[symbol].trades++;
      symbolMap[symbol].profit += trade.profit || 0;
    });
    
    // Convertir a array para renderizar
    return Object.entries(symbolMap).map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      profit: data.profit
    }));
  }, [trades]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Detalles del {formattedDate}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        
        {trades.length === 0 ? (
          <div className="text-center py-8">
            <p>No hay operaciones disponibles para esta fecha.</p>
          </div>
        ) : (
          <>
            {/* Resumen de estadísticas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${(stats?.totalProfit || 0) >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <h3 className="text-gray-600 text-sm">Profit/Loss Total</h3>
                <p className={`text-2xl font-bold ${(stats?.totalProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${stats?.totalProfit.toFixed(2)}
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-50">
                <h3 className="text-gray-600 text-sm">Operaciones</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalTrades} ({stats?.winningTrades}W / {stats?.losingTrades}L)
                </p>
                <p className="text-sm text-gray-500">
                  Win Rate: {stats?.winRate.toFixed(2)}%
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-gray-600 text-sm">Promedio Gan/Pérd</h3>
                <div className="flex justify-between">
                  <div>
                    <span className="text-gray-600 text-xs">Ganancia</span>
                    <p className="text-lg font-semibold text-green-500">${stats?.avgWin.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Pérdida</span>
                    <p className="text-lg font-semibold text-red-500">${stats?.avgLoss.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rendimiento por símbolo */}
            <h3 className="text-lg font-semibold mb-3">Rendimiento por Símbolo</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="py-2 px-4 text-left">SÍMBOLO</th>
                    <th className="py-2 px-4 text-center">OPERACIONES</th>
                    <th className="py-2 px-4 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {symbolStats.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4">{item.symbol}</td>
                      <td className="py-2 px-4 text-center">{item.trades}</td>
                      <td className={`py-2 px-4 text-right ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${item.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Operaciones del Día */}
            <h3 className="text-lg font-semibold mb-3">Operaciones del Día</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="py-2 px-3 text-left">HORA</th>
                    <th className="py-2 px-3 text-left">TICKET</th>
                    <th className="py-2 px-3 text-left">SÍMBOLO</th>
                    <th className="py-2 px-3 text-left">TIPO</th>
                    <th className="py-2 px-3 text-right">VOLUMEN</th>
                    <th className="py-2 px-3 text-right">PRECIO</th>
                    <th className="py-2 px-3 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trades.map((trade, index) => {
                    // Extraer la hora de la operación
                    const tradeTime = new Date(trade.time);
                    const timeStr = format(tradeTime, 'HH:mm:ss');
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-2 px-3">{timeStr}</td>
                        <td className="py-2 px-3">{trade.ticket}</td>
                        <td className="py-2 px-3">{trade.symbol}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs 
                            ${isBuyOperation(trade.type) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'}`}
                          >
                            {formatTradeType(trade.type)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">{trade.volume}</td>
                        <td className="py-2 px-3 text-right">{trade.price.toFixed(5)}</td>
                        <td className={`py-2 px-3 text-right ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${trade.profit.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyTradeDetails; 