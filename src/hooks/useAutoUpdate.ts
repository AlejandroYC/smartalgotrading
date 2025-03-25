// src/hooks/useAutoUpdate.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import { MT5Client } from '@/services/mt5/mt5Client';
import { debounce } from 'lodash'; // Asegúrate de tener lodash instalado
import { ensureNetProfitInDailyResults } from '@/contexts/TradingDataContext';

// Clave para localStorage que controla qué instancia del hook está activa
const ACTIVE_INSTANCE_KEY = 'smartalgo_auto_update_active_instance';

// Clave para guardar si la actualización automática está habilitada globalmente
const AUTO_UPDATE_ENABLED_KEY = 'smartalgo_auto_update_enabled';

interface UpdateStatus {
  isUpdating: boolean;
  lastUpdate: Date | null;
  error: string | null;
  updateCount: number;  // Contador de actualizaciones exitosas
  autoUpdateEnabled: boolean; // Estado de la actualización automática
  nextUpdateTime: Date | null; // Tiempo estimado para la próxima actualización
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

// Ajustar los intervalos de tiempo (aumentados para evitar sobrecarga)
const UPDATE_INTERVAL = process.env.NODE_ENV === 'development' 
  ? 5 * 60 * 1000    // 5 minutos en desarrollo
  : 30 * 60 * 1000;  // 30 minutos en producción

// Delay para la primera actualización al cargar la página
const INITIAL_UPDATE_DELAY = 1500; // Reducir a 1.5 segundos (antes era 5 segundos)

// Tiempo mínimo entre actualizaciones (throttling)
const MIN_TIME_BETWEEN_UPDATES = 30000; // Reducir a 30 segundos (antes era 60 segundos)

// URL del backend de MT5
const MT5_API_URL = process.env.NODE_ENV === 'development'
  ? '/api/mt5'  // Usar el proxy en desarrollo
  : (process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.225.209.243.nip.io');

// Función para calcular y formatear la próxima actualización
const formatNextUpdateTime = (date: Date | null): string => {
  if (!date) return 'No programada';
  return date.toLocaleTimeString();
};

// Crear un singleton para manejar las actualizaciones en toda la aplicación
class UpdateManager {
  private static instance: UpdateManager;
  private isUpdating: boolean = false;
  private lastUpdateTime: number = 0;
  private updateIntervalRef: NodeJS.Timeout | null = null;
  private initialUpdateTimeoutRef: NodeJS.Timeout | null = null;
  private subscribers: Set<(status: UpdateStatus) => void> = new Set();
  private status: UpdateStatus = {
    isUpdating: false,
    lastUpdate: null,
    error: null,
    updateCount: 0,
    autoUpdateEnabled: true,
    nextUpdateTime: null
  };
  private instanceId: string = Math.random().toString(36).substring(2, 9);
  private initialized: boolean = false;

  private constructor() {
    
    // Verificar si la actualización automática está habilitada globalmente
    const autoUpdateEnabled = localStorage.getItem(AUTO_UPDATE_ENABLED_KEY);
    if (autoUpdateEnabled === 'false') {
      this.status.autoUpdateEnabled = false;
    }
    
    // Verificar si hay una última actualización guardada
    const lastUpdateTimeStr = localStorage.getItem('smartalgo_last_update_time');
    if (lastUpdateTimeStr) {
      this.lastUpdateTime = parseInt(lastUpdateTimeStr);
      this.status.lastUpdate = new Date(this.lastUpdateTime);
      
      // Verificar si hay un contador de actualizaciones guardado
      const updateCountStr = localStorage.getItem('smartalgo_update_count');
      if (updateCountStr) {
        this.status.updateCount = parseInt(updateCountStr);
      }
    }
  }

  public static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  public getStatus(): UpdateStatus {
    return { ...this.status };
  }

  public subscribe(callback: (status: UpdateStatus) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private updateStatus(newStatus: Partial<UpdateStatus>): void {
    this.status = { ...this.status, ...newStatus };
    
    // Si se actualiza el estado de autoUpdateEnabled, guardarlo en localStorage
    if (newStatus.autoUpdateEnabled !== undefined) {
      localStorage.setItem(AUTO_UPDATE_ENABLED_KEY, newStatus.autoUpdateEnabled.toString());
    }
    
    // Si se actualiza el contador de actualizaciones, guardarlo en localStorage
    if (newStatus.updateCount !== undefined) {
      localStorage.setItem('smartalgo_update_count', newStatus.updateCount.toString());
    }
    
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback(this.status);
    });
  }

  public clearAllIntervals(): void {

    
    if (this.initialUpdateTimeoutRef) {
      clearTimeout(this.initialUpdateTimeoutRef);
      this.initialUpdateTimeoutRef = null;
    }
    
    if (this.updateIntervalRef) {
      clearInterval(this.updateIntervalRef);
      this.updateIntervalRef = null;
    }
  }

  public canUpdate(): boolean {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    if (timeSinceLastUpdate < MIN_TIME_BETWEEN_UPDATES) {
      return false;
    }
    
    return true;
  }

  public scheduleNextUpdate(): Date {
    const nextUpdate = new Date();
    nextUpdate.setTime(nextUpdate.getTime() + UPDATE_INTERVAL);
    
    this.updateStatus({
      nextUpdateTime: nextUpdate
    });
    
    return nextUpdate;
  }

  public async performUpdate(force: boolean = false, refreshData: () => void): Promise<void> {
    // Verificar si hay una actualización forzada post-login
    const forcePostLogin = typeof window !== 'undefined' && sessionStorage.getItem('force_dashboard_update');
    
    // Verificar si hay navegación interna (solo bloqueamos si no es post-login y no es forzada)
    if (!forcePostLogin && !force && typeof window !== 'undefined' && sessionStorage.getItem('dashboard_internal_navigation')) {
      console.log('🛑 Actualización bloqueada: navegación interna detectada');
      return;
    }
    
    // Evitar actualizaciones si ya hay una en curso (a menos que sea forzada)
    if (this.status.isUpdating && !force && !forcePostLogin) {
      return;
    }
    
    // Verificar si puede actualizar (tiempo transcurrido) - omitir si es forzada o post-login
    if (!force && !forcePostLogin && !this.canUpdate()) {
      return;
    }
    
    try {
      // Obtener el account_number del localStorage
      const currentAccount = localStorage.getItem('smartalgo_current_account');
      
      if (!currentAccount) {
        this.updateStatus({
          isUpdating: false,
          error: 'No se encontró número de cuenta activa'
        });
        return;
      }

      this.updateStatus({ isUpdating: true, error: null });
      
      // IMPORTANTE: Guardar el rango de fechas actual antes de la actualización
      let currentDateRange = null;
      if (typeof window !== 'undefined') {
        try {
          // Intentar recuperar el rango de fechas desde localStorage si existe
          const savedRange = localStorage.getItem('smartalgo_current_date_range');
          if (savedRange) {
            currentDateRange = JSON.parse(savedRange);
          }
        } catch (error) {
          console.error('Error al recuperar rango de fechas:', error);
        }
      }

      const mt5Client = MT5Client.getInstance();
      const response = await mt5Client.updateAccountData(currentAccount);

      if (response.success && response.data) {
        // Procesar los daily_results para asegurarnos que incluyan net_profit (profit + swap)
        if (response.data.statistics?.daily_results) {
          // Log para diagnóstico
          console.log('useAutoUpdate: Procesando daily_results para incluir net_profit', {
            tieneSwapAlgunDia: Object.values(response.data.statistics.daily_results).some((day: any) => day.swap !== undefined)
          });
          
          // Convertir a any para evitar problemas con el tipo
          const dataAny = response.data as any;
          
          // Usar la función centralizada para procesar daily_results
          if (dataAny.statistics?.daily_results) {
            ensureNetProfitInDailyResults(dataAny.statistics.daily_results);
            
            // Guardar los datos procesados de vuelta en el storage
            if (typeof window !== 'undefined') {
              const storageKey = `smartalgo_${currentAccount}_account_data`;
              const existingData = localStorage.getItem(storageKey);
              
              if (existingData) {
                try {
                  const parsedData = JSON.parse(existingData);
                  
                  // Actualizar daily_results con los valores procesados
                  if (parsedData.statistics?.daily_results) {
                    parsedData.statistics.daily_results = dataAny.statistics.daily_results;
                    localStorage.setItem(storageKey, JSON.stringify(parsedData));
                  }
                } catch (error) {
                  console.error('Error actualizando daily_results en localStorage:', error);
                }
              }
            }
          }
        }
        
        // IMPORTANTE: Restaurar el rango de fechas después de la actualización
        if (currentDateRange && typeof window !== 'undefined') {
          localStorage.setItem('smartalgo_current_date_range', JSON.stringify(currentDateRange));
        }
        
        refreshData();
        
        // Actualizar la referencia de tiempo de la última actualización
        this.lastUpdateTime = Date.now();
        localStorage.setItem('smartalgo_last_update_time', this.lastUpdateTime.toString());
        
        // Programar próxima actualización
        const nextUpdate = this.scheduleNextUpdate();
      } else {
        // Mejorar el manejo de errores específicos
        let errorMessage = response.message || 'Error desconocido en la actualización';
        
        // Detectar error específico de método no permitido
        if (response.message && response.message.includes('Method Not Allowed')) {
          errorMessage = 'Error de configuración: El método de solicitud HTTP es incorrecto. Contacta al administrador del sistema.';
          console.error('❌ Error en la API: Método HTTP incorrecto. La API espera POST pero se está usando otro método.');
        }
        
        console.error('❌ Error en respuesta de actualización:', response);
        
        this.updateStatus({
          isUpdating: false,
          error: errorMessage
        });
        return;
      }

      this.updateStatus({
        isUpdating: false,
        lastUpdate: new Date(),
        error: null,
        updateCount: this.status.updateCount + 1
      });

    } catch (err: any) {
      console.error(`❌ Error en actualización [ID: ${this.instanceId}]:`, err);
      
      // Mensaje de error más descriptivo
      let errorMessage = err.message || 'Error desconocido durante la actualización';
      
      // Detectar error de conexión
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      }
      
      this.updateStatus({
        isUpdating: false,
        error: errorMessage
      });
    }
  }

  public toggleAutoUpdate(refreshData: () => void): void {
    if (this.status.autoUpdateEnabled) {
      this.clearAllIntervals();
      
      this.updateStatus({
        autoUpdateEnabled: false,
        nextUpdateTime: null
      });
      
      // Eliminar la instancia activa si esta instancia la desactivó
      if (localStorage.getItem(ACTIVE_INSTANCE_KEY) === this.instanceId) {
        localStorage.removeItem(ACTIVE_INSTANCE_KEY);
      }
    } else {
      
      // Limpiar cualquier intervalo anterior
      this.clearAllIntervals();
      
      // Programar nueva actualización
      const nextUpdate = new Date();
      nextUpdate.setTime(nextUpdate.getTime() + UPDATE_INTERVAL);
      
      // Configurar el nuevo intervalo
      this.updateIntervalRef = setInterval(() => {
        this.performUpdate(false, refreshData);
      }, UPDATE_INTERVAL);
      
      this.updateStatus({
        autoUpdateEnabled: true,
        nextUpdateTime: nextUpdate
      });
      
      // Registrar esta instancia como la activa
      localStorage.setItem(ACTIVE_INSTANCE_KEY, this.instanceId);
    }
  }

  public startAutoUpdate(refreshData: () => void): void {
    // Verificar si hay una actualización forzada post-login
    const forcePostLogin = typeof window !== 'undefined' && sessionStorage.getItem('force_dashboard_update');
    
    // Verificar si estamos en una navegación interna (solo bloqueamos si no es post-login)
    if (!forcePostLogin && typeof window !== 'undefined' && sessionStorage.getItem('dashboard_internal_navigation')) {
      console.log('🛑 Iniciación de auto-actualización bloqueada: navegación interna detectada');
      return;
    }
    
    // Verificar si ya hay una instancia activa
    const activeInstanceId = localStorage.getItem(ACTIVE_INSTANCE_KEY);
    
    // Si ya hay una instancia activa y no es esta, intentar tomar el control
    // en lugar de no hacer nada (cambio de comportamiento)
    if (activeInstanceId && activeInstanceId !== this.instanceId) {
      console.log('⚠️ Detectada otra instancia activa, tomando el control...');
      localStorage.setItem(ACTIVE_INSTANCE_KEY, this.instanceId);
    }
    
    // Prevenir inicializaciones múltiples
    if (this.initialized) {
      return;
    }
    
    this.initialized = true;
    
    // Solo configurar si la actualización automática está habilitada
    if (!this.status.autoUpdateEnabled) {
      // CAMBIO: Habilitar automáticamente si está desactivada
      this.updateStatus({
        autoUpdateEnabled: true
      });
      console.log('🔄 Auto-actualización habilitada automáticamente');
    }
    
    // Registrar esta instancia como la activa
    localStorage.setItem(ACTIVE_INSTANCE_KEY, this.instanceId);
    
    // Verificar y limpiar cualquier configuración anterior
    this.clearAllIntervals();
    
    // CAMBIO: No verificar última actualización, forzar siempre una inicial
    this.setupInitialUpdate(refreshData);
    
    // Configurar el intervalo para actualizaciones regulares
    if (this.updateIntervalRef) {
      clearInterval(this.updateIntervalRef);
    }
    
    this.updateIntervalRef = setInterval(() => {
      // Verificar si hay navegación interna
      if (typeof window !== 'undefined' && sessionStorage.getItem('dashboard_internal_navigation')) {
        console.log('🛑 Actualización periódica bloqueada: navegación interna detectada');
        return;
      }
      
      // Verificar si esta instancia sigue siendo la activa antes de realizar la actualización
      const currentActiveInstance = localStorage.getItem(ACTIVE_INSTANCE_KEY);
      if (currentActiveInstance !== this.instanceId) {
        // CAMBIO: En lugar de detener, tomar el control
        localStorage.setItem(ACTIVE_INSTANCE_KEY, this.instanceId);
      }
      
      this.performUpdate(false, refreshData);
    }, UPDATE_INTERVAL);
    
    // Registrar la próxima actualización programada
    const nextUpdate = new Date();
    nextUpdate.setTime(nextUpdate.getTime() + UPDATE_INTERVAL);
    
    this.updateStatus({
      nextUpdateTime: nextUpdate
    });
  }
  
  private setupInitialUpdate(refreshData: () => void): void {
    // Configurar la actualización inicial con un tiempo reducido
    this.initialUpdateTimeoutRef = setTimeout(() => {
      // Verificar si hay una actualización forzada post-login
      const forcePostLogin = typeof window !== 'undefined' && sessionStorage.getItem('force_dashboard_update');
      
      // Verificar si hay navegación interna antes de la actualización inicial (solo si no es post-login)
      if (!forcePostLogin && typeof window !== 'undefined' && sessionStorage.getItem('dashboard_internal_navigation')) {
        console.log('🛑 Actualización inicial bloqueada: navegación interna detectada');
        return;
      }
      
      console.log('🔄 Ejecutando actualización inicial desde setupInitialUpdate...');
      this.performUpdate(true, refreshData);
    }, INITIAL_UPDATE_DELAY);
  }
}

// Limitar el número de instancias usando un módulo compartido
let hookInstanceCount = 0;

// Hook personalizado para gestión de actualizaciones
export function useAutoUpdate(userId: string | undefined) {
  const { refreshData } = useTradingData();
  const [status, setStatus] = useState<UpdateStatus>({
    isUpdating: false,
    lastUpdate: null,
    error: null,
    updateCount: 0,
    autoUpdateEnabled: true,
    nextUpdateTime: null
  });
  
  // Tracking de instancias para depuración
  const instanceNum = useRef(++hookInstanceCount);
  
  // Usar la instancia singleton del UpdateManager
  const updateManager = useRef<UpdateManager>(UpdateManager.getInstance());
  
  // Referencia para controlar si ya se inició el proceso
  const setupComplete = useRef(false);
  
  // Referencia para controlar intentos de actualización
  const attemptCount = useRef(0);
  
  // Efecto para suscribirse a los cambios de estado
  useEffect(() => {
    
    // Sincronizar estado inicial
    setStatus(updateManager.current.getStatus());
    
    // Suscribirse a actualizaciones
    const unsubscribe = updateManager.current.subscribe(newStatus => {
      setStatus(newStatus);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Efecto para iniciar la actualización automática, solo se ejecuta una vez
  useEffect(() => {
    if (userId && !setupComplete.current) {
      setupComplete.current = true;
      
      // Verificar si venimos de un login (tiene prioridad sobre navegación interna)
      const forceUpdate = typeof window !== 'undefined' && sessionStorage.getItem('force_dashboard_update');
      
      // Verificar si estamos en una navegación interna
      const isInternalNavigation = typeof window !== 'undefined' && sessionStorage.getItem('dashboard_internal_navigation');
      
      // Si venimos de un login, forzar actualización (incluso con navegación interna)
      if (forceUpdate) {
        console.log('🚀 Forzando actualización después del login...');
        
        // Limpiar el flag para evitar actualizaciones duplicadas
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('force_dashboard_update');
        }
        
        // Limpiar banderas para asegurar actualización fresca
        localStorage.removeItem('smartalgo_last_refresh_time');
        localStorage.removeItem('smartalgo_last_update_time');
        
        // Primero iniciar el sistema de actualización automática
        try {
          // Iniciar inmediatamente sin esperar
          updateManager.current.startAutoUpdate(refreshData);
          
          // Ejecutar una actualización forzada después de un breve momento
          setTimeout(() => {
            console.log('🔄 Ejecutando actualización post-login...');
            updateManager.current.performUpdate(true, refreshData);
          }, 1000);
        } catch (error) {
          console.error(`❌ Error al iniciar actualización post-login:`, error);
          setStatus(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : String(error)
          }));
        }
      }
      // Solo proceder con la actualización automática si no es navegación interna
      else if (!isInternalNavigation) {
        console.log('🚀 Iniciando actualización automática al cargar el dashboard...');
        
        // Limpiar banderas para asegurar actualización fresca
        localStorage.removeItem('smartalgo_last_refresh_time');
        
        // Primero iniciar el sistema de actualización automática
        try {
          // Iniciar inmediatamente sin esperar
          updateManager.current.startAutoUpdate(refreshData);
          
          // Ejecutar una actualización forzada después de un breve momento
          // para dar tiempo a que la UI se cargue completamente
          setTimeout(() => {
            // Verificar de nuevo si se estableció un flag de navegación interna
            if (sessionStorage.getItem('dashboard_internal_navigation')) {
              console.log('🔍 Navegación interna detectada durante la inicialización, evitando actualización forzada');
              return;
            }
            
            console.log('🔄 Ejecutando actualización inicial...');
            updateManager.current.performUpdate(true, refreshData);
          }, 2000); // Incrementar a 2 segundos para dar tiempo a que se detecte la navegación
        } catch (error) {
          console.error(`❌ Error al iniciar actualización automática:`, error);
          setStatus(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : String(error)
          }));
        }
      } else {
        console.log('🔍 Detectada navegación interna, omitiendo actualización automática inicial');
      }
    }
    
    return () => {
      // Limpiar si es necesario
    };
  }, [userId, refreshData]); // Dependencias
  
  // Función para realizar actualización manual
  const manualUpdate = useCallback(() => {
    // Verificar si hay demasiados intentos consecutivos
    if (attemptCount.current > 5) {
      // Reiniciar después de 30 segundos
      setTimeout(() => {
        attemptCount.current = 0;
      }, 30000);
      
      return;
    }
    
    // Verificar si estamos en una navegación interna reciente
    if (typeof window !== 'undefined') {
      const isNavInternal = sessionStorage.getItem('dashboard_internal_navigation');
      if (isNavInternal) {
        console.log('🛑 Actualización manual bloqueada: navegación interna en progreso');
        return;
      }
    }
    
    attemptCount.current++;
    
    try {
      // Limpiar la bandera de actualización reciente en localStorage para forzar una actualización
      localStorage.removeItem('smartalgo_last_refresh_time');
      localStorage.removeItem('smartalgo_last_update_time');
      
      // Notificar inicio de actualización
      setStatus(prev => ({ ...prev, isUpdating: true, error: null }));
      
      // Ejecutar actualización
      updateManager.current.performUpdate(true, refreshData);
      
      // Programar un reinicio del contador después de un tiempo
      setTimeout(() => {
        if (attemptCount.current > 0) {
          attemptCount.current--;
        }
      }, 60000);
    } catch (error) {
      console.error(`❌ Error en actualización manual:`, error);
      setStatus(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, [refreshData]);
  
  // Función para activar/desactivar la actualización automática
  const toggleAutoUpdate = useCallback(() => {
    try {
      updateManager.current.toggleAutoUpdate(refreshData);
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, [refreshData]);
  
  return {
    status,
    manualUpdate,
    toggleAutoUpdate
  };
}