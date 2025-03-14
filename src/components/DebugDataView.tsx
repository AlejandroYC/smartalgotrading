'use client';

import React, { useState } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';

const DebugDataView: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { 
    processedData, 
    currentAccount, 
    loading, 
    error,
    rawData,
    userAccounts,
    refreshData
  } = useTradingData();

  const toggleExpanded = () => setExpanded(!expanded);

  const debugData = {
    processedData: processedData 
      ? {
          netProfit: processedData.net_profit,
          winRate: processedData.win_rate,
          totalTrades: processedData.total_trades,
          winningTrades: processedData.winning_trades,
          losingTrades: processedData.losing_trades,
          ...(processedData.daily_results 
            ? { dailyResultsCount: Object.keys(processedData.daily_results).length } 
            : { dailyResults: null }
          )
        }
      : null,
    currentAccount,
    loading,
    error,
    userAccountsCount: userAccounts.length,
    rawDataExists: !!rawData
  };

  // Verificar los datos en localStorage
  const checkLocalStorage = () => {
    const storageKeys: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('smartalgo_')) {
        storageKeys[key] = key.includes('account_data') 
          ? 'Datos de cuenta (muy extensos para mostrar)' 
          : localStorage.getItem(key) || '';
      }
    }
    return storageKeys;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleExpanded}
      >
        <h3 className="text-xl font-semibold text-gray-800">
          Debug Info {processedData ? '✅' : '❌'}
        </h3>
        <span className="text-gray-500">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className="mt-4">
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Estado del contexto</h4>
            <ul className="list-disc pl-5 text-sm">
              <li>
                <span className="font-medium">Cuenta actual:</span>{' '}
                <span className={currentAccount ? 'text-green-600' : 'text-red-600'}>
                  {currentAccount || 'No seleccionada'}
                </span>
              </li>
              <li>
                <span className="font-medium">Datos procesados:</span>{' '}
                <span className={processedData ? 'text-green-600' : 'text-red-600'}>
                  {processedData ? 'Disponibles' : 'No disponibles'}
                </span>
              </li>
              <li>
                <span className="font-medium">Datos brutos:</span>{' '}
                <span className={rawData ? 'text-green-600' : 'text-red-600'}>
                  {rawData ? 'Disponibles' : 'No disponibles'}
                </span>
              </li>
              <li>
                <span className="font-medium">Estado de carga:</span>{' '}
                <span className={loading ? 'text-amber-600' : 'text-green-600'}>
                  {loading ? 'Cargando' : 'Completo'}
                </span>
              </li>
              <li>
                <span className="font-medium">Error:</span>{' '}
                <span className={error ? 'text-red-600' : 'text-green-600'}>
                  {error || 'Ninguno'}
                </span>
              </li>
              <li>
                <span className="font-medium">Cuentas disponibles:</span>{' '}
                <span>
                  {userAccounts.length > 0 
                    ? userAccounts.map(acc => acc.account_number).join(', ')
                    : 'Ninguna'
                  }
                </span>
              </li>
            </ul>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">LocalStorage</h4>
            <div className="bg-gray-100 p-4 rounded overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(checkLocalStorage(), null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Solución de problemas</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Forzar actualización de datos
                  refreshData();
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refrescar datos
              </button>
              
              <button
                onClick={() => {
                  localStorage.removeItem('smartalgo_last_refresh_time');
                  window.location.reload();
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugDataView; 