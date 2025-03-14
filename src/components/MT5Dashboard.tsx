'use client';

import { useEffect, useState, useCallback } from 'react';
import { MT5AccountInfo, MT5Position } from '@/types/metatrader';
import { MT5Client } from '@/services/mt5/mt5Client';
import { useAuth } from '@/hooks/useAuth';
import { useMTConnections } from '@/hooks/useMTConnections';
import MT5ConnectionForm from './MT5ConnectionForm';

interface UpdateLog {
  timestamp: string;
  data: {
    balance: number;
    equity: number;
    positions: number;
    profit: number;
  };
}

export default function MT5Dashboard() {
  const { user } = useAuth();
  const { connections } = useMTConnections();
  const activeConnection = connections.find(conn => conn.is_active);
  const [accountInfo, setAccountInfo] = useState<MT5AccountInfo | null>(null);
  const [positions, setPositions] = useState<MT5Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);

  const loadMT5Data = useCallback(async () => {
    if (!user?.id || !activeConnection?.id) return;

    try {
      setLoading(true);
      const mt5Client = MT5Client.getInstance();

      if (!activeConnection.password || !activeConnection.server) {
        throw new Error('Missing MT5 credentials');
      }

      const accountData = await mt5Client.getAccountData(
        user.id,
        activeConnection.id,
        {
          account_number: activeConnection.account_number,
          password: activeConnection.password,
          server: activeConnection.server
        }
      );

      setAccountInfo(accountData);
      setPositions(accountData.positions || []);

      // Agregar a los logs
      setUpdateLogs(prev => [{
        timestamp: new Date().toISOString(),
        data: {
          balance: accountData.balance,
          equity: accountData.equity,
          positions: accountData.positions?.length || 0,
          profit: accountData.floating_pl || 0
        }
      }, ...prev.slice(0, 19)]);  // Mantener solo los últimos 20 logs

      setError(null);
    } catch (err) {
      console.error('Error loading MT5 data:', err);
      setError('Failed to load MT5 data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeConnection]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id && activeConnection?.id) {
      loadMT5Data();
    }
  }, [user, activeConnection, loadMT5Data]);

  // Actualización automática cada 5 minutos
  useEffect(() => {
    if (!user?.id || !activeConnection?.id) return;
    const interval = setInterval(() => {
      loadMT5Data();
    }, 5 * 60 * 1000); // 5 minutos

    return () => {

      clearInterval(interval);
    };
  }, [user?.id, activeConnection?.id, loadMT5Data]);

  const startPolling = useCallback(() => {
    if (!user?.id || !activeConnection?.id) return;



    const pollInterval = setInterval(async () => {
      try {
        const mt5Client = MT5Client.getInstance();
        const accountData = await mt5Client.getActiveAccountStatus(
          user.id,
          activeConnection.id,  // Asegúrate de que esto sea el ID de conexión, no una fecha
          undefined,  // fromDate (opcional)
          undefined   // toDate (opcional)
        );

        setAccountInfo(accountData);
        setPositions(accountData.positions || []);

        // Agregar a los logs
        setUpdateLogs(prev => [{
          timestamp: new Date().toISOString(),
          data: {
            balance: accountData.balance,
            equity: accountData.equity,
            positions: accountData.positions?.length || 0,
            profit: accountData.floating_pl || 0
          }
        }, ...prev.slice(0, 19)]);

        setError(null);
      } catch (err) {
        console.error('Error polling MT5 data:', err);
      }
    }, 30000);

    return pollInterval;
  }, [user?.id, activeConnection?.id]);

  if (!user) {
    return <div>Please sign in to connect your MT5 account.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p className="text-red-500">{error}</p>
        <MT5ConnectionForm onSuccess={loadMT5Data} />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {!accountInfo ? (
          <MT5ConnectionForm onSuccess={loadMT5Data} />
        ) : (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600">Balance</p>
                  <p className="text-xl font-medium">${accountInfo.balance}</p>
                </div>
                <div>
                  <p className="text-gray-600">Equity</p>
                  <p className="text-xl font-medium">${accountInfo.equity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Profit</p>
                  <p className="text-xl font-medium">${accountInfo.profit}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Symbol</th>
                      <th className="text-left">Type</th>
                      <th className="text-left">Volume</th>
                      <th className="text-left">Open Price</th>
                      <th className="text-left">Current Price</th>
                      <th className="text-left">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position, index) => (
                      <tr key={index}>
                        <td>{position.symbol}</td>
                        <td>{position.type}</td>
                        <td>{position.volume}</td>
                        <td>${position.open_price}</td>
                        <td>${position.current_price}</td>
                        <td className={position.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${position.profit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ventana de actualizaciones fuera del contenedor principal */}
      <div
        className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className="text-sm font-medium text-gray-700">Live Updates</h3>
          </div>
          <span className="text-xs text-gray-500">
            {updateLogs.length > 0
              ? `Last update: ${new Date(updateLogs[0].timestamp).toLocaleTimeString()}`
              : 'Waiting for updates...'}
          </span>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-4 bg-white">
          {updateLogs.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No updates yet
            </div>
          ) : (
            updateLogs.map((log, index) => (
              <div key={index} className="text-xs mb-3 pb-3 border-b last:border-0">
                <div className="flex justify-between text-gray-500 mb-1">
                  <span className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">Balance:</span>
                    <span className="ml-1 font-medium">${log.data.balance.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">Equity:</span>
                    <span className="ml-1 font-medium">${log.data.equity.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">Positions:</span>
                    <span className="ml-1 font-medium">{log.data.positions}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">P/L:</span>
                    <span className={`ml-1 font-medium ${log.data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${log.data.profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
} 