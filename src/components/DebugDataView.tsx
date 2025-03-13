'use client';

import React, { useState } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';

const DebugDataView: React.FC = () => {
  const { processedData, dateRange, rawData } = useTradingData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Estado para la verificación manual
  const [manualStartDate, setManualStartDate] = useState('');
  const [manualEndDate, setManualEndDate] = useState('');
  const [manualResults, setManualResults] = useState<any>(null);

  if (!processedData) return null;

  // Función para verificar manualmente los cálculos para un rango de fechas específico
  const calculateManualVerification = () => {
    if (!manualStartDate || !manualEndDate || !rawData?.history) return;
    
    try {
      const startDate = new Date(manualStartDate);
      const endDate = new Date(manualEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Filtrar trades por el rango de fechas manual
      const filteredTrades = rawData.history.filter((trade: any) => {
        try {
          let tradeDate: Date;
          if (typeof trade.time === 'number') {
            tradeDate = new Date(trade.time * 1000);
          } else {
            tradeDate = new Date(trade.time);
          }
          
          if (isNaN(tradeDate.getTime())) return false;
          
          return tradeDate >= startDate && tradeDate <= endDate;
        } catch (e) {
          return false;
        }
      });
      
      // Calcular estadísticas
      const winningTrades = filteredTrades.filter((t: any) => t.profit > 0).length;
      const losingTrades = filteredTrades.filter((t: any) => t.profit < 0).length;
      const totalProfit = filteredTrades.reduce((sum: number, t: any) => sum + t.profit, 0);
      
      // Formatos para las fechas
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Filtrar daily_results basado en el rango manual
      const dailyResults = rawData.statistics?.daily_results || {};
      const filteredDailyResults = Object.entries(dailyResults)
        .filter(([dateStr, _]: [string, any]) => dateStr >= startDateStr && dateStr <= endDateStr)
        .reduce((acc: any, [date, data]: [string, any]) => {
          acc[date] = data;
          return acc;
        }, {});
      
      const dailyProfitSum = Object.values(filteredDailyResults)
        .reduce((sum: number, day: any) => sum + day.profit, 0);
      
      // Guardar resultados
      setManualResults({
        totalTrades: filteredTrades.length,
        winningTrades,
        losingTrades,
        totalProfit,
        dailyProfitSum,
        difference: totalProfit - dailyProfitSum,
        filteredDailyResults,
        daysCount: Object.keys(filteredDailyResults).length
      });
    } catch (error) {
      console.error('Error en verificación manual:', error);
      setManualResults({
        error: 'Error al calcular la verificación manual'
      });
    }
  };

  // Función para renderizar una tabla de datos
  const renderTable = (data: any, excludeKeys: string[] = []) => {
    const keys = Object.keys(data).filter(key => !excludeKeys.includes(key));
    return (
      <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
        <tbody>
          {keys.map(key => (
            <tr key={key} className="border-b border-gray-200 dark:border-gray-700">
              <td className="py-2 px-4 font-medium">{key}</td>
              <td className="py-2 px-4">
                {
                  typeof data[key] === 'object' ? 
                    JSON.stringify(data[key]) : 
                    data[key].toString()
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Calcular estadísticas para validación
  const totalTrades = processedData.total_trades || 0;
  const winningTrades = processedData.winning_trades || 0;
  const losingTrades = processedData.losing_trades || 0;
  const netProfit = processedData.net_profit || 0;
  const winRate = processedData.win_rate || 0;
  
  // Verificar suma de días
  const totalDays = Object.keys(processedData.daily_results || {}).length;
  const winningDays = processedData.winning_days || 0;
  const losingDays = processedData.losing_days || 0;
  const breakEvenDays = processedData.break_even_days || 0;
  
  // Calcular suma de profit diario para comparar
  const dailyProfitSum = Object.values(processedData.daily_results || {})
    .reduce((sum: number, day: any) => sum + day.profit, 0);

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Datos de depuración ({dateRange.label})</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {isExpanded ? 'Contraer' : 'Expandir'}
        </button>
      </div>
      
      {isExpanded && (
        <div>
          <div className="flex space-x-2 mb-4 border-b">
            <button
              className={`px-3 py-2 ${activeTab === 'summary' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Resumen
            </button>
            <button
              className={`px-3 py-2 ${activeTab === 'trades' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('trades')}
            >
              Trades
            </button>
            <button
              className={`px-3 py-2 ${activeTab === 'days' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('days')}
            >
              Días
            </button>
            <button
              className={`px-3 py-2 ${activeTab === 'validation' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('validation')}
            >
              Validación
            </button>
            <button
              className={`px-3 py-2 ${activeTab === 'manual' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              Verificación Manual
            </button>
          </div>
          
          {activeTab === 'summary' && (
            <div>
              <h4 className="font-medium mb-2">Estadísticas calculadas:</h4>
              {renderTable(processedData, ['daily_results', 'rawTrades'])}
            </div>
          )}
          
          {activeTab === 'trades' && (
            <div>
              <h4 className="font-medium mb-2">Primeros 10 trades (de {processedData.rawTrades?.length || 0}):</h4>
              {processedData.rawTrades && processedData.rawTrades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="py-2 px-4">ID</th>
                        <th className="py-2 px-4">Fecha</th>
                        <th className="py-2 px-4">Tipo</th>
                        <th className="py-2 px-4">Símbolo</th>
                        <th className="py-2 px-4">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.rawTrades.slice(0, 10).map((trade: any, index: number) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-2 px-4">{trade.ticket}</td>
                          <td className="py-2 px-4">
                            {typeof trade.time === 'number' 
                              ? new Date(trade.time * 1000).toLocaleString() 
                              : new Date(trade.time).toLocaleString()}
                          </td>
                          <td className="py-2 px-4">{trade.type}</td>
                          <td className="py-2 px-4">{trade.symbol}</td>
                          <td className={`py-2 px-4 ${trade.profit > 0 ? 'text-green-500' : trade.profit < 0 ? 'text-red-500' : ''}`}>
                            {trade.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay trades para mostrar</p>
              )}
            </div>
          )}
          
          {activeTab === 'days' && (
            <div>
              <h4 className="font-medium mb-2">Resultados diarios:</h4>
              {Object.keys(processedData.daily_results || {}).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="py-2 px-4">Fecha</th>
                        <th className="py-2 px-4">Profit</th>
                        <th className="py-2 px-4">Trades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(processedData.daily_results || {}).map(([date, data]: [string, any]) => (
                        <tr key={date} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-2 px-4">{date}</td>
                          <td className={`py-2 px-4 ${data.profit > 0 ? 'text-green-500' : data.profit < 0 ? 'text-red-500' : ''}`}>
                            {data.profit.toFixed(2)}
                          </td>
                          <td className="py-2 px-4">{data.trades}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay resultados diarios para mostrar</p>
              )}
            </div>
          )}
          
          {activeTab === 'validation' && (
            <div>
              <h4 className="font-medium mb-2">Validación de cálculos:</h4>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <h5 className="font-medium mb-2">Trades</h5>
                <p><span className="font-medium">Total trades:</span> {totalTrades}</p>
                <p><span className="font-medium">Winning trades:</span> {winningTrades} ({(winRate * 100).toFixed(2)}%)</p>
                <p><span className="font-medium">Losing trades:</span> {losingTrades}</p>
                <p><span className="font-medium">Verificación:</span> {winningTrades + losingTrades} {winningTrades + losingTrades === totalTrades ? '✅' : '❌'}</p>
                
                <h5 className="font-medium mt-4 mb-2">Días</h5>
                <p><span className="font-medium">Total días:</span> {totalDays}</p>
                <p><span className="font-medium">Días ganadores:</span> {winningDays}</p>
                <p><span className="font-medium">Días perdedores:</span> {losingDays}</p>
                <p><span className="font-medium">Días neutros:</span> {breakEvenDays}</p>
                <p><span className="font-medium">Verificación:</span> {winningDays + losingDays + breakEvenDays} {winningDays + losingDays + breakEvenDays === totalDays ? '✅' : '❌'}</p>
                
                <h5 className="font-medium mt-4 mb-2">Profit</h5>
                <p><span className="font-medium">Net Profit:</span> {netProfit.toFixed(2)}</p>
                <p><span className="font-medium">Suma de profit diario:</span> {dailyProfitSum.toFixed(2)}</p>
                <p><span className="font-medium">Diferencia:</span> {(netProfit - dailyProfitSum).toFixed(2)} {Math.abs(netProfit - dailyProfitSum) < 0.01 ? '✅' : '❌'}</p>
                
                <h5 className="font-medium mt-4 mb-2">Rango de fechas</h5>
                <p><span className="font-medium">Desde:</span> {dateRange.startDate.toISOString().split('T')[0]}</p>
                <p><span className="font-medium">Hasta:</span> {dateRange.endDate.toISOString().split('T')[0]}</p>
              </div>
            </div>
          )}
          
          {activeTab === 'manual' && (
            <div>
              <h4 className="font-medium mb-2">Verificación manual por rango de fechas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha inicio</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded"
                    value={manualStartDate}
                    onChange={(e) => setManualStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha fin</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded"
                    value={manualEndDate}
                    onChange={(e) => setManualEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                onClick={calculateManualVerification}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
                disabled={!manualStartDate || !manualEndDate}
              >
                Calcular
              </button>
              
              {manualResults && (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded mt-4">
                  <h5 className="font-medium mb-2">Resultados para {manualStartDate} a {manualEndDate}</h5>
                  
                  {manualResults.error ? (
                    <p className="text-red-500">{manualResults.error}</p>
                  ) : (
                    <>
                      <p><span className="font-medium">Total trades:</span> {manualResults.totalTrades}</p>
                      <p><span className="font-medium">Winning trades:</span> {manualResults.winningTrades}</p>
                      <p><span className="font-medium">Losing trades:</span> {manualResults.losingTrades}</p>
                      <p><span className="font-medium">Net Profit:</span> {manualResults.totalProfit?.toFixed(2)}</p>
                      <p><span className="font-medium">Días incluidos:</span> {manualResults.daysCount}</p>
                      <p><span className="font-medium">Suma de profit diario:</span> {manualResults.dailyProfitSum?.toFixed(2)}</p>
                      <p><span className="font-medium">Diferencia:</span> {manualResults.difference?.toFixed(2)}</p>
                      
                      {manualResults.daysCount > 0 && (
                        <div className="mt-4">
                          <h6 className="font-medium mb-2">Días incluidos:</h6>
                          <div className="overflow-x-auto max-h-60">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-200 dark:bg-gray-600">
                                  <th className="py-1 px-2 text-left">Fecha</th>
                                  <th className="py-1 px-2 text-right">Profit</th>
                                  <th className="py-1 px-2 text-right">Trades</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(manualResults.filteredDailyResults || {}).map(([date, data]: [string, any]) => (
                                  <tr key={date} className="border-b border-gray-300 dark:border-gray-600">
                                    <td className="py-1 px-2">{date}</td>
                                    <td className={`py-1 px-2 text-right ${data.profit > 0 ? 'text-green-500' : data.profit < 0 ? 'text-red-500' : ''}`}>
                                      {data.profit.toFixed(2)}
                                    </td>
                                    <td className="py-1 px-2 text-right">{data.trades}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugDataView; 