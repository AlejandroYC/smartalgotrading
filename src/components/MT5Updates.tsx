'use client';
import { useEffect, useState } from 'react';
import { ensureNetProfitInDailyResults } from '@/contexts/TradingDataContext';

interface MT5UpdatesProps {
  userId: string;
  connectionId: string;
  MT5_API_URL: string;
  onUpdate?: (data: any) => void;
}

export const MT5Updates = ({ userId, connectionId, MT5_API_URL, onUpdate }: MT5UpdatesProps) => {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [updateCount, setUpdateCount] = useState(0);
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  const connectMT5 = async () => {
    try {
      const response = await fetch(`${MT5_API_URL}/connect/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: "19166543",
          password: "J2&cN6d%",
          server: "Weltrade-Demo",
          connection_id: connectionId
        })
      });

      const data = await response.json();
      if (!data.success) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch(
        `${MT5_API_URL}/account-info/${userId}/${connectionId}`
      );
      
      const data = await response.json();
      
      if (!data.success) {
        
        if (data.code === 'NO_CONNECTION') {
          setStatus('loading');
          const connected = await connectMT5();
          if (connected) {
            fetchAccountInfo();
          } else {
            setStatus('error');
          }
        } else {
          setStatus('error');
        }
        return;
      }

      // Verificar si tenemos swap en los datos recibidos para hacer más robusto el procesamiento
      if (data.data && data.data.positions) {
        // Log para diagnóstico
        console.log('MT5UPDATES: Verificando datos de posiciones con swap:', {
          hayPosiciones: data.data.positions.length > 0,
          primeraPosicionConSwap: data.data.positions[0]?.swap !== undefined,
          ejemploSwap: data.data.positions[0]?.swap
        });
      }

      // Si tenemos daily_results, asegurarnos de que incluyan net_profit (profit + swap)
      if (data.data && data.data.statistics && data.data.statistics.daily_results) {
        const daily_results = data.data.statistics.daily_results;
        
        // Log simplificado para diagnóstico
        console.log('MT5UPDATES: Procesando daily_results para incluir net_profit', {
          hayDailyResults: Object.keys(daily_results).length > 0
        });
        
        // Usar la función centralizada para asegurar net_profit
        ensureNetProfitInDailyResults(daily_results);
        
        // Actualizar el objeto data.data con los daily_results procesados
        data.data.statistics.daily_results = daily_results;
      }
      
      setLastUpdate(new Date().toLocaleTimeString());
      setUpdateCount(prev => prev + 1);
      setStatus('connected');
      onUpdate?.(data.data);
      
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    // Fetch inicial
    fetchAccountInfo();

    // Actualizar cada 5 minutos (300000 ms)
    const interval = setInterval(fetchAccountInfo, 300000);

    return () => clearInterval(interval);
  }, [userId, connectionId]);

  // Indicador de estado
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            status === 'connected' ? 'bg-green-500' :
            status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm">
          Status: {status}
        </span>
      </div>
      {lastUpdate && (
        <div className="text-xs text-gray-500 mt-1">
          Last update: {lastUpdate}
          <br />
          Updates received: {updateCount}
        </div>
      )}
    </div>
  );
}; 