// src/hooks/useAutoUpdate.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import { MT5Client } from '@/services/mt5/mt5Client';
import { debounce } from 'lodash'; // Asegúrate de tener lodash instalado

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
const INITIAL_UPDATE_DELAY = 5000; // 5 segundos

// Tiempo mínimo entre actualizaciones (throttling)
const MIN_TIME_BETWEEN_UPDATES = 60000; // 1 minuto mínimo entre actualizaciones

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
    console.log(`🔧 Creando instancia de UpdateManager [ID: ${this.instanceId}]`);
    
    // Verificar si la actualización automática está habilitada globalmente
    const autoUpdateEnabled = localStorage.getItem(AUTO_UPDATE_ENABLED_KEY);
    if (autoUpdateEnabled === 'false') {
      this.status.autoUpdateEnabled = false;
      console.log('⏹️ Actualización automática deshabilitada globalmente');
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
    console.log(`🔔 Nuevo suscriptor añadido. Total: ${this.subscribers.size}`);
    return () => {
      this.subscribers.delete(callback);
      console.log(`🔕 Suscriptor eliminado. Total: ${this.subscribers.size}`);
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
    console.log(`🧹 Limpiando temporizadores de actualización automática [ID: ${this.instanceId}]`);
    console.log(`   - Intervalo de actualización: ${this.updateIntervalRef ? 'Activo' : 'Inactivo'}`);
    console.log(`   - Timeout inicial: ${this.initialUpdateTimeoutRef ? 'Activo' : 'Inactivo'}`);
    
    if (this.initialUpdateTimeoutRef) {
      clearTimeout(this.initialUpdateTimeoutRef);
      this.initialUpdateTimeoutRef = null;
      console.log('   ✅ Timeout inicial eliminado');
    }
    
    if (this.updateIntervalRef) {
      clearInterval(this.updateIntervalRef);
      this.updateIntervalRef = null;
      console.log('   ✅ Intervalo de actualización eliminado');
    }
  }

  public canUpdate(): boolean {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    if (timeSinceLastUpdate < MIN_TIME_BETWEEN_UPDATES) {
      console.log(`⏱️ Actualización demasiado frecuente. Han pasado solo ${Math.floor(timeSinceLastUpdate/1000)} segundos desde la última actualización.`);
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
    // Evitar actualizaciones simultáneas
    if (this.status.isUpdating) {
      console.log('⚠️ Ya hay una actualización en proceso, omitiendo...');
      return;
    }
    
    // Verificar throttling a menos que sea una actualización forzada
    if (!force && !this.canUpdate()) {
      console.log('🛑 Actualización omitida por throttling. Intente más tarde.');
      return;
    }

    try {
      // Obtener el account_number del localStorage
      const lastActiveAccount = localStorage.getItem('smartalgo_last_active_account');
      
      if (!lastActiveAccount) {
        console.log('No se encontró número de cuenta activa');
        this.updateStatus({
          isUpdating: false,
          error: 'No se encontró número de cuenta activa'
        });
        return;
      }

      this.updateStatus({ isUpdating: true, error: null });
      
      console.log(`🔄 Iniciando actualización de datos... [ID: ${this.instanceId}]`);

      const mt5Client = MT5Client.getInstance();
      const response = await mt5Client.updateAccountData(lastActiveAccount);

      if (response.success && response.data) {
        console.log(`✅ Datos actualizados correctamente [ID: ${this.instanceId}]`);
        refreshData();
        
        // Actualizar la referencia de tiempo de la última actualización
        this.lastUpdateTime = Date.now();
        localStorage.setItem('smartalgo_last_update_time', this.lastUpdateTime.toString());
        
        // Programar próxima actualización
        const nextUpdate = this.scheduleNextUpdate();
        console.log(`⏱️ Próxima actualización programada para: ${formatNextUpdateTime(nextUpdate)} [ID: ${this.instanceId}]`);
      } else {
        console.error('❌ Error en respuesta de actualización:', response);
      }

      this.updateStatus({
        isUpdating: false,
        lastUpdate: new Date(),
        error: null,
        updateCount: this.status.updateCount + 1
      });

    } catch (err: any) {
      console.error(`❌ Error en actualización [ID: ${this.instanceId}]:`, err);
      this.updateStatus({
        isUpdating: false,
        error: err.message || 'Error desconocido durante la actualización'
      });
    }
  }

  public toggleAutoUpdate(refreshData: () => void): void {
    if (this.status.autoUpdateEnabled) {
      console.log(`⏹️ Actualización automática desactivada [ID: ${this.instanceId}]`);
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
      console.log(`🔄 Actualización automática activada [ID: ${this.instanceId}]`);
      
      // Limpiar cualquier intervalo anterior
      this.clearAllIntervals();
      
      // Programar nueva actualización
      const nextUpdate = new Date();
      nextUpdate.setTime(nextUpdate.getTime() + UPDATE_INTERVAL);
      
      // Configurar el nuevo intervalo
      this.updateIntervalRef = setInterval(() => {
        console.log(`🔄 Ejecutando actualización programada [ID: ${this.instanceId}]`);
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
    // Verificar si ya hay una instancia activa
    const activeInstanceId = localStorage.getItem(ACTIVE_INSTANCE_KEY);
    
    // Si ya hay una instancia activa y no es esta, no hacer nada
    if (activeInstanceId && activeInstanceId !== this.instanceId) {
      console.log(`⚠️ Ya hay una instancia activa [ID: ${activeInstanceId}], esta instancia [ID: ${this.instanceId}] no iniciará la actualización automática`);
      return;
    }
    
    // Prevenir inicializaciones múltiples
    if (this.initialized) {
      console.log(`⚠️ UpdateManager ya inicializado, omitiendo inicialización duplicada [ID: ${this.instanceId}]`);
      return;
    }
    
    this.initialized = true;
    
    // Solo configurar si la actualización automática está habilitada
    if (!this.status.autoUpdateEnabled) {
      console.log(`ℹ️ Actualización automática deshabilitada, omitiendo configuración [ID: ${this.instanceId}]`);
      return;
    }
    
    console.log(`⏱️ Configurando actualización automática inicial en ${INITIAL_UPDATE_DELAY/1000} segundos [ID: ${this.instanceId}]`);
    
    // Registrar esta instancia como la activa
    localStorage.setItem(ACTIVE_INSTANCE_KEY, this.instanceId);
    
    // Verificar y limpiar cualquier configuración anterior
    this.clearAllIntervals();
    
    // Verificar si hay una actualización reciente (del localStorage, compartida entre instancias)
    const lastUpdateTimeStr = localStorage.getItem('smartalgo_last_update_time');
    if (lastUpdateTimeStr) {
      const lastUpdateTime = parseInt(lastUpdateTimeStr);
      const now = Date.now();
      const timeSince = now - lastUpdateTime;
      
      // Si han pasado menos de 2 minutos desde la última actualización, retrasamos la próxima
      if (timeSince < 2 * 60 * 1000) {
        console.log(`ℹ️ Actualización reciente detectada hace ${Math.floor(timeSince/1000)} segundos, ajustando temporización [ID: ${this.instanceId}]`);
        
        // Ajustar el tiempo de última actualización en este singleton
        this.lastUpdateTime = lastUpdateTime;
        
        // Calcular tiempo para la próxima actualización (para evitar actualizaciones demasiado cercanas)
        const timeToNextUpdate = Math.max(MIN_TIME_BETWEEN_UPDATES - timeSince, INITIAL_UPDATE_DELAY);
        console.log(`⏱️ Próxima actualización en ${timeToNextUpdate/1000} segundos [ID: ${this.instanceId}]`);
        
        // Ajustar el timeout inicial
        this.initialUpdateTimeoutRef = setTimeout(() => {
          console.log(`🔄 Ejecutando actualización inicial retrasada [ID: ${this.instanceId}]`);
          this.performUpdate(true, refreshData);
        }, timeToNextUpdate);
      } else {
        // Actualización normal si ha pasado suficiente tiempo
        console.log(`ℹ️ Han pasado ${Math.floor(timeSince/1000)} segundos desde la última actualización, procediendo con normalidad [ID: ${this.instanceId}]`);
        this.setupInitialUpdate(refreshData);
      }
    } else {
      // Primera actualización (no hay registro previo)
      console.log(`ℹ️ No hay registro de actualización previa, configurando actualización inicial [ID: ${this.instanceId}]`);
      this.setupInitialUpdate(refreshData);
    }
    
    // Configurar el intervalo para actualizaciones regulares
    if (this.updateIntervalRef) {
      console.log(`⚠️ Ya existe un intervalo de actualización, se elimina y reemplaza [ID: ${this.instanceId}]`);
      clearInterval(this.updateIntervalRef);
    }
    
    this.updateIntervalRef = setInterval(() => {
      // Verificar si esta instancia sigue siendo la activa antes de realizar la actualización
      const currentActiveInstance = localStorage.getItem(ACTIVE_INSTANCE_KEY);
      if (currentActiveInstance !== this.instanceId) {
        console.log(`⚠️ Esta instancia [ID: ${this.instanceId}] ya no es la activa, omitiendo actualización programada`);
        this.clearAllIntervals(); // Detener intervalos si ya no es la instancia activa
        return;
      }
      
      console.log(`🔄 Ejecutando actualización programada [ID: ${this.instanceId}]`);
      this.performUpdate(false, refreshData);
    }, UPDATE_INTERVAL);
    
    // Registrar la próxima actualización programada
    const nextUpdate = new Date();
    nextUpdate.setTime(nextUpdate.getTime() + UPDATE_INTERVAL);
    
    this.updateStatus({
      nextUpdateTime: nextUpdate
    });
    
    console.log(`⏱️ Próxima actualización automática programada para: ${formatNextUpdateTime(nextUpdate)} [ID: ${this.instanceId}]`);
  }
  
  private setupInitialUpdate(refreshData: () => void): void {
    // Configurar la actualización inicial
    this.initialUpdateTimeoutRef = setTimeout(() => {
      console.log(`🔄 Ejecutando actualización inicial [ID: ${this.instanceId}]`);
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
  
  // Efecto para suscribirse a los cambios de estado
  useEffect(() => {
    console.log(`🔄 Iniciando hook useAutoUpdate #${instanceNum.current}`);
    
    // Sincronizar estado inicial
    setStatus(updateManager.current.getStatus());
    
    // Suscribirse a actualizaciones
    const unsubscribe = updateManager.current.subscribe(newStatus => {
      setStatus(newStatus);
    });
    
    return () => {
      console.log(`👋 Finalizando hook useAutoUpdate #${instanceNum.current}`);
      unsubscribe();
    };
  }, []);
  
  // Efecto para iniciar la actualización automática, solo se ejecuta una vez
  useEffect(() => {
    if (userId) {
      console.log(`🔑 Usuario identificado en hook #${instanceNum.current}, iniciando actualización automática`);
      updateManager.current.startAutoUpdate(refreshData);
    } else {
      console.log(`⚠️ Sin usuario en hook #${instanceNum.current}, no se inicia actualización automática`);
    }
    
    return () => {
      console.log(`👋 Limpieza de useEffect en hook #${instanceNum.current}`);
    };
  }, [userId, refreshData]);
  
  // Función para realizar actualización manual
  const manualUpdate = useCallback(() => {
    console.log(`🖱️ Actualización manual solicitada desde hook #${instanceNum.current}`);
    updateManager.current.performUpdate(true, refreshData);
  }, [refreshData]);
  
  // Función para activar/desactivar la actualización automática
  const toggleAutoUpdate = useCallback(() => {
    console.log(`🔄 Cambio de estado de actualización automática desde hook #${instanceNum.current}`);
    updateManager.current.toggleAutoUpdate(refreshData);
  }, [refreshData]);
  
  return {
    status,
    manualUpdate,
    toggleAutoUpdate
  };
}