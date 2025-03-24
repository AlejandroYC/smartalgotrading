'use client';
import React from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';

const DebugNetPL: React.FC = () => {
  const { processedData, rawData, dateRange } = useTradingData();

  // Calcular suma manual de todos los profit en rawTrades
  const calculateManualSum = () => {
    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      return 0;
    }

    // Filtrar por operaciones cerradas (entry = 1) y sumar los profits
    const manualSum = processedData.rawTrades
      .filter((trade: any) => trade.entry === 1) // Solo operaciones cerradas
      .reduce((sum: number, trade: any) => {
        const profit = typeof trade.profit === 'string' 
          ? parseFloat(trade.profit) 
          : trade.profit;
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0);

    return manualSum;
  };

  // Calcular profit factor manualmente
  const calculateManualProfitFactor = () => {
    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      return 1;
    }

    // Filtrar por trades que no son depósitos (type !== 2)
    const validTrades = processedData.rawTrades.filter((trade: any) => trade.type !== 2);

    // Calcular ganancias brutas
    const grossWins = validTrades
      .filter((trade: any) => Number(trade.profit) > 0)
      .reduce((sum: number, trade: any) => {
        const profit = typeof trade.profit === 'string' 
          ? parseFloat(trade.profit) 
          : trade.profit;
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0);

    // Calcular pérdidas brutas (valor absoluto)
    const grossLosses = Math.abs(validTrades
      .filter((trade: any) => Number(trade.profit) < 0)
      .reduce((sum: number, trade: any) => {
        const profit = typeof trade.profit === 'string' 
          ? parseFloat(trade.profit) 
          : trade.profit;
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0));

    // Evitar división por cero
    return grossLosses > 0 ? grossWins / grossLosses : 1;
  };

  // Calcular profit factor incluyendo operaciones de tipo 2
  const calculateProfitFactorWithDeposits = () => {
    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      return 1;
    }

    // Usar todos los trades, incluyendo depósitos
    const allTrades = processedData.rawTrades;

    // Calcular ganancias brutas
    const grossWins = allTrades
      .filter((trade: any) => Number(trade.profit) > 0)
      .reduce((sum: number, trade: any) => {
        const profit = typeof trade.profit === 'string' 
          ? parseFloat(trade.profit) 
          : trade.profit;
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0);

    // Calcular pérdidas brutas (valor absoluto)
    const grossLosses = Math.abs(allTrades
      .filter((trade: any) => Number(trade.profit) < 0)
      .reduce((sum: number, trade: any) => {
        const profit = typeof trade.profit === 'string' 
          ? parseFloat(trade.profit) 
          : trade.profit;
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0));

    // Evitar división por cero
    return grossLosses > 0 ? grossWins / grossLosses : 1;
  };

  // Calcular suma alternativa considerando otros factores
  const calculateAlternativeSum = () => {
    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      return 0;
    }

    // Incluir todas las operaciones, incluyendo parciales
    const alternativeSum = processedData.rawTrades
      .reduce((sum: number, trade: any) => {
        const profit = typeof trade.profit === 'string' 
          ? parseFloat(trade.profit) 
          : trade.profit;
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0);

    return alternativeSum;
  };

  // Obtener la suma diaria directamente de los resultados diarios
  const calculateFromDailyResults = () => {
    if (!processedData?.daily_results) {
      return 0;
    }

    const dailySum = Object.values(processedData.daily_results as Record<string, any>)
      .reduce((sum: number, day: any) => {
        const profit = typeof day.profit === 'string' 
          ? parseFloat(day.profit) 
          : day.profit;
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0);

    return dailySum;
  };

  // Obtener los primeros y últimos trades para verificar
  const getSampleTrades = () => {
    if (!processedData?.rawTrades || !Array.isArray(processedData.rawTrades)) {
      return {
        firstTrades: [],
        lastTrades: []
      };
    }

    // Ordenar por timestamp (si está disponible) o por otro campo relevante
    const sortedTrades = [...processedData.rawTrades].sort((a, b) => {
      if (a.time && b.time) {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      }
      return 0;
    });

    // Devolver primeros 5 y últimos 5 trades
    return {
      firstTrades: sortedTrades.slice(0, 5),
      lastTrades: sortedTrades.slice(-5)
    };
  };

  // Verificar el formato de las fechas y el filtrado por rango
  const checkDateRanges = () => {
    if (!dateRange) return null;

    return {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      label: dateRange.label,
      numberOfDays: Math.floor((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const manualSum = calculateManualSum();
  const manualProfitFactor = calculateManualProfitFactor();
  const alternativeSum = calculateAlternativeSum();
  const dailySum = calculateFromDailyResults();
  const profitFactorWithDeposits = calculateProfitFactorWithDeposits();
  const sampleTrades = getSampleTrades();
  const dateInfo = checkDateRanges();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Si no hay datos, mostrar un mensaje de carga
  if (!processedData) {
    return <div className="p-4 bg-white rounded-lg shadow">Cargando datos...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow text-sm mb-4">
      <h2 className="text-lg font-bold mb-3 text-red-600">⚠️ Depuración de Net P&L</h2>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Valores de P&L</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">Valor reportado (processedData.net_profit):</td>
                <td className="p-2 font-mono">{formatCurrency(processedData.net_profit || 0)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Suma manual (solo operaciones cerradas):</td>
                <td className="p-2 font-mono">{formatCurrency(manualSum)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Suma alternativa (todas las operaciones):</td>
                <td className="p-2 font-mono">{formatCurrency(alternativeSum)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Suma de resultados diarios:</td>
                <td className="p-2 font-mono">{formatCurrency(dailySum)}</td>
              </tr>
              <tr className="border-b bg-yellow-50">
                <td className="p-2 font-medium">Discrepancia (esperado vs. actual):</td>
                <td className="p-2 font-mono">{formatCurrency(-127.54 - (processedData.net_profit || 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Valores de Profit Factor</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">Valor reportado (processedData.profit_factor):</td>
                <td className="p-2 font-mono">{processedData.profit_factor?.toFixed(2) || "1.00"}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Calculado manualmente (sin depósitos/retiros):</td>
                <td className="p-2 font-mono">{manualProfitFactor.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Calculado con depósitos/retiros:</td>
                <td className="p-2 font-mono">{profitFactorWithDeposits.toFixed(2)}</td>
              </tr>
              <tr className="border-b bg-yellow-50">
                <td className="p-2 font-medium">Discrepancia (esperado vs. actual):</td>
                <td className="p-2 font-mono">{(0.74 - (processedData.profit_factor || 1)).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Información del rango de fechas</h3>
          {dateInfo && (
            <div>
              <p>Desde: {new Date(dateInfo.startDate).toLocaleDateString()}</p>
              <p>Hasta: {new Date(dateInfo.endDate).toLocaleDateString()}</p>
              <p>Etiqueta: {dateInfo.label}</p>
              <p>Número de días: {dateInfo.numberOfDays}</p>
            </div>
          )}
        </div>

        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Estadísticas de trades</h3>
          <p>Total de trades: {processedData.rawTrades?.length || 0}</p>
          <p>Trades cerrados (entry=1): {
            (processedData.rawTrades || [])
              .filter((t: any) => t.entry === 1).length
          }</p>
          <p>Trades abiertos (entry=0): {
            (processedData.rawTrades || [])
              .filter((t: any) => t.entry === 0).length
          }</p>
        </div>

        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Primeros 5 trades (muestra)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Entry</th>
                  <th className="p-2 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(sampleTrades.firstTrades) && sampleTrades.firstTrades.length > 0 ? (
                  sampleTrades.firstTrades.map((trade: any, index: number) => (
                    <tr key={`first-${index}`} className="border-b">
                      <td className="p-2">{trade.time ? new Date(trade.time).toLocaleString() : 'N/A'}</td>
                      <td className="p-2">{trade.symbol || 'N/A'}</td>
                      <td className="p-2">{trade.type !== undefined ? trade.type : 'N/A'}</td>
                      <td className="p-2">{trade.entry !== undefined ? trade.entry : 'N/A'}</td>
                      <td className="p-2 text-right">{trade.profit !== undefined ? formatCurrency(trade.profit) : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-2 text-center text-gray-500">No hay datos disponibles</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Últimos 5 trades (muestra)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Entry</th>
                  <th className="p-2 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(sampleTrades.lastTrades) && sampleTrades.lastTrades.length > 0 ? (
                  sampleTrades.lastTrades.map((trade: any, index: number) => (
                    <tr key={`last-${index}`} className="border-b">
                      <td className="p-2">{trade.time ? new Date(trade.time).toLocaleString() : 'N/A'}</td>
                      <td className="p-2">{trade.symbol || 'N/A'}</td>
                      <td className="p-2">{trade.type !== undefined ? trade.type : 'N/A'}</td>
                      <td className="p-2">{trade.entry !== undefined ? trade.entry : 'N/A'}</td>
                      <td className="p-2 text-right">{trade.profit !== undefined ? formatCurrency(trade.profit) : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-2 text-center text-gray-500">No hay datos disponibles</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4">
        <strong>Nota:</strong> Este componente es solo para depuración. Elimina o comenta 
        cuando hayas identificado el problema.
      </p>
    </div>
  );
};

export default DebugNetPL; 