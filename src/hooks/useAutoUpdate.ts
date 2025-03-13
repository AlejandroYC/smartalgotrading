// src/hooks/useAutoUpdate.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import { MT5Client } from '@/services/mt5/mt5Client';
import { debounce } from 'lodash'; // Asegúrate de tener lodash instalado

interface UpdateStatus {
  isUpdating: boolean;
  lastUpdate: Date | null;
  error: string | null;
  updateCount: number;  // Contador de actualizaciones exitosas
}

// Interfaz para datos de conexión almacenados
interface StoredConnection {
  accountNumber: string;
  connectionId: string;
  server: string;
  password?: string;
}

interface StoredData {
  [key: string]: string | null;
}

// Ajustar los intervalos de tiempo
const UPDATE_INTERVAL = process.env.NODE_ENV === 'development' 
  ? 1 * 60 * 1000    // 1 minuto
  : 30 * 60 * 1000;  // 30 minutos en producción

// Delay para la primera actualización al cargar la página
const INITIAL_UPDATE_DELAY = 3000; // 3 segundos

// Delay mínimo entre actualizaciones manuales
const MANUAL_UPDATE_COOLDOWN = 10000; // 10 segundos

// URL del backend de MT5
const MT5_API_URL = process.env.NODE_ENV === 'development'
  ? '/api/mt5'  // Usar el proxy en desarrollo
  : (process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.225.209.243.nip.io');

export function useAutoUpdate(userId: string | undefined) {
  const { refreshData } = useTradingData();
  const [status, setStatus] = useState<UpdateStatus>({
    isUpdating: false,
    lastUpdate: null,
    error: null,
    updateCount: 0
  });
  
  const performUpdate = useCallback(async () => {
    if (!userId || status.isUpdating) return;

    try {
      // Obtener el account_number del localStorage
      const lastActiveAccount = localStorage.getItem('smartalgo_last_active_account');
      
      if (!lastActiveAccount) {
        console.log('No se encontró número de cuenta activa');
        setStatus(prev => ({
          ...prev,
          isUpdating: false,
          error: 'No se encontró número de cuenta activa'
        }));
        return;
      }

      setStatus(prev => ({ ...prev, isUpdating: true, error: null }));

      const mt5Client = MT5Client.getInstance();
      const response = await mt5Client.updateAccountData(lastActiveAccount);

      if (response.success && response.data) {
        console.log('✅ Datos actualizados correctamente');
        refreshData();
      }

      setStatus(prev => ({
        isUpdating: false,
        lastUpdate: new Date(),
        error: null,
        updateCount: prev.updateCount + 1
      }));

    } catch (err: any) {
      console.error('❌ Error en actualización:', err);
      setStatus(prev => ({
        ...prev,
        isUpdating: false,
        error: err.message || 'Error desconocido durante la actualización'
      }));
    }
  }, [userId, status.isUpdating, refreshData]);
  
  return {
    status,
    manualUpdate: performUpdate
  };
}