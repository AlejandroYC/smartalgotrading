import axios, { AxiosInstance } from 'axios';
import { MT5AccountInfo, MT5Position, MT5HistoricalData } from '@/types/metatrader';
import { MT5Config } from './config';
import { toast } from 'react-hot-toast';
import { EventEmitter } from 'events';
import { LocalStorageService, StoredAccountData } from '@/services/LocalStorageService';
import { supabase } from '@/lib/supabase';

export interface MT5ConnectionParams {
  accountNumber: string;
  password: string;
  server: string;
  connection_id?: string;  // Ahora es opcional
}

interface MT5FullAccountData {
  login: number;
  name: string;
  server: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  margin_free: number;
  floating_pl: number;
  deals: Array<{
    ticket: number;
    order: number;
    time: number;
    type: number;
    entry: number;
    position_id: number;
    symbol: string;
    volume: number;
    price: number;
    profit: number;
    swap: number;
    commission: number;
    magic: number;
    comment: string;
  }>;
  positions: Array<{
    ticket: number;
    time: number;
    type: number;
    symbol: string;
    volume: number;
    open_price: number;
    current_price: number;
    sl: number;
    tp: number;
    profit: number;
    swap: number;
    comment: string;
  }>;
  server_time: string;
  connection_id: string;
  statistics?: {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    total_profit: number;
    daily_results: Record<string, { profit: number; trades: number }>;
  };
}

interface MT5Stats {
  balance: number;
  equity: number;
  margin: number;
  floating_pl: number;
  positions_count: number;
  positions: any[];
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  gross_profit: number;
  gross_loss: number;
  net_profit: number;
  total_days: number;
  winning_days: number;
  losing_days: number;
  break_even_days: number;
  day_win_rate: number;
  daily_results: Record<string, any>;
  closed_trades: any[];
  deals: any[];
}

interface HistoricalDataRequest {
  type: 'historical_request';
  from_date?: string;
  to_date?: string;
  connection_id: string;
  user_id: string;
}

interface HistoricalDataResponse {
  type: 'historical_response';
  status: 'loading' | 'success' | 'error';
  progress?: number;
  message?: string;
  data?: any;
  error?: string;
}

export interface AccountStatusResponse {
  success: boolean;
  data: MT5Stats;
  message?: string;
}

export interface MT5ConnectionResponse {
  success: boolean;
  data?: {
    connection_id: string;
    account_info: any;
    registered: boolean;
  };
  error?: string;
}

interface MT5ConnectResponse {
  success: boolean;
  error?: string;
  connection_id: string;
  should_clear_storage?: boolean;
  data: {
    account: MT5AccountInfo;
    positions: MT5Position[];
    history: MT5HistoricalData[];
    statistics: {
      total_trades: number;
      winning_trades: number;
      losing_trades: number;
      win_rate: number;
      total_profit: number;
      daily_results: Record<string, { profit: number; trades: number }>;
    };
  };
}

interface ActiveAccount {
  userId: string;
  accountNumber: string;
  connectionId: string;
}

interface UpdateAccountDataResponse {
  success: boolean;
  message?: string;
  data: {
    account: MT5AccountInfo;
    positions: MT5Position[];
    history: MT5HistoricalData[];
    statistics: {
      total_trades: number;
      winning_trades: number;
      losing_trades: number;
      win_rate: number;
      total_profit: number;
      daily_results: Record<string, { profit: number; trades: number }>;
    };
  };
}

// Constantes para claves de localStorage
const STORAGE_PREFIX = 'smartalgo_';
const ACCOUNT_DATA_KEY_FORMAT = (accountNumber: string) => `${STORAGE_PREFIX}${accountNumber}_account_data`;
const CURRENT_ACCOUNT_KEY = `${STORAGE_PREFIX}current_account`;
const LAST_ACTIVE_ACCOUNT_KEY = `${STORAGE_PREFIX}last_active_account`;

export class MT5Client extends EventEmitter {
  private static instance: MT5Client;
  private baseUrl: string;
  private readonly axiosInstance: AxiosInstance;
  private userId: string | null = null;
  private connectionId: string | null = null;
  private isConnecting: boolean = false;
  private credentials: MT5ConnectionParams | null = null;
  
  private activeConnections: Map<string, {
    connectionId: string;
    accountNumber: string;
    server: string;
    lastUpdate: number;
    cachedData: MT5FullAccountData | null;
  }> = new Map();

  private constructor() {
    super();
    
    // Usar la URL del entorno por defecto
    this.baseUrl = process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.225.209.243.nip.io';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => {
        return status >= 200 && status < 500;
      },
    });

    // Simplificar los interceptores para solo registrar errores
    this.axiosInstance.interceptors.request.use(
      config => config,
      error => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      response => response,
      error => Promise.reject(error)
    );
  }

  // Método para inicializar la URL personalizada
  private initializeCustomUrl() {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      const customApiUrl = localStorage.getItem('smartalgo_api_url_override');
      if (customApiUrl) {
        this.baseUrl = customApiUrl;
        this.axiosInstance.defaults.baseURL = customApiUrl;
      }
    }
  }

  public static getInstance(): MT5Client {
    if (!MT5Client.instance) {
      MT5Client.instance = new MT5Client();
      // Inicializar la URL personalizada solo cuando se obtiene la instancia
      // y solo en el cliente
      if (typeof window !== 'undefined') {
        MT5Client.instance.initializeCustomUrl();
      }
    }
    return MT5Client.instance;
  }

  async getAccountData(userId: string, accountNumber?: string): Promise<any> {
    if (!accountNumber) {
      const lastActive = LocalStorageService.getLastActiveAccount(userId);
      if (!lastActive) {
        throw new Error("No active account found");
      }
      accountNumber = lastActive.accountNumber;
    }
    
    if (!accountNumber) {
      throw new Error("Account number is required");
    }
    
    const accounts = LocalStorageService.getUserAccounts(userId) as { [key: string]: StoredAccountData };
    const cachedData = accounts[accountNumber];
    
    if (cachedData && !LocalStorageService.needsUpdate(cachedData)) {
      return cachedData;
    }
    
    try {
      const accountDetails = await this.fetchAccountCredentials(userId, accountNumber);
      
      const freshData = await this.connectAccount(userId, {
        accountNumber,
        password: accountDetails.password,
        server: accountDetails.server,
        connection_id: cachedData?.connectionId || crypto.randomUUID()
      });
      
      const newStoredData: StoredAccountData = {
        accountId: freshData.connection_id,
        connectionId: freshData.connection_id,
        accountInfo: freshData,
        positions: freshData.positions,
        history: [freshData.deals],
        statistics: {
          total_trades: freshData.statistics?.total_trades || 0,
          winning_trades: freshData.statistics?.winning_trades || 0,
          losing_trades: freshData.statistics?.losing_trades || 0,
          win_rate: freshData.statistics?.win_rate || 0,
          net_profit: freshData.statistics?.total_profit || 0,
          profit_factor: 1,
          avg_win: 0,
          avg_loss: 0,
          winning_days: 0,
          losing_days: 0,
          break_even_days: 0,
          day_win_rate: 0,
          daily_results: freshData.statistics?.daily_results || {}
        },
        accountNumber,
        server: accountDetails.server,
        lastUpdated: new Date().toISOString()
      };
      
      LocalStorageService.saveAccountData(userId, newStoredData);
      
      return newStoredData;
    } catch (error) {
      if (cachedData) {
        console.warn("Using cached data - update failed", error);
        return { ...cachedData, isOutdated: true };
      }
      throw error;
    }
  }

  private async fetchAccountCredentials(userId: string, accountNumber: string) {
    const response = await fetch(`/api/account-credentials?userId=${userId}&accountNumber=${accountNumber}`);
    if (!response.ok) {
      throw new Error('Could not fetch account credentials');
    }
    return await response.json();
  }

  async getPositions(userId: string, connectionId: string): Promise<MT5Position[]> {
    try {
      const response = await this.axiosInstance.get(`/positions/${userId}/${connectionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw new Error('Failed to fetch positions');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try a basic health check request
      const response = await this.axiosInstance.get('/', {
        timeout: 5000  // Reduced timeout for faster feedback
      });
      return response.status === 200;
    } catch (error) {
      console.error('Server connection test failed:', error);
      return false;
    }
  }

  public async connectAccount(userId: string, params: MT5ConnectionParams): Promise<MT5FullAccountData> {
    try {
      this.isConnecting = true;
      
      // Validar campos requeridos
      if (!userId) {
        console.error('Error: userId es undefined o null');
        throw new Error('userId es un campo requerido');
      }
      
      if (!params.accountNumber || !params.server) {
        console.error('Error: campos requeridos faltantes', { 
          accountNumber: !!params.accountNumber, 
          server: !!params.server 
        });
        throw new Error('accountNumber y server son campos requeridos');
      }
      
      // Validar que la password no esté vacía
      if (!params.password) {
        console.error('Error: password está vacía');
        throw new Error('password es un campo requerido');
      }
      
      const response = await this.axiosInstance.post<MT5ConnectResponse>('/connect', {
        user_id: userId,
        account_number: params.accountNumber,
        password: params.password,
        server: params.server,
        platform_type: "MT5"
      });

      const responseData = response.data;
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to connect account');
      }

      // Asegurarnos de que tenemos todos los datos necesarios
      const connectionId = responseData.connection_id;
      if (!connectionId) {
        throw new Error('No se recibió connection_id del servidor');
      }

      // CRÍTICO: Forzar limpieza de localStorage para evitar problemas con cuentas anteriores
      if (typeof window !== 'undefined') {
        // Esto asegura que la referencia a la última cuenta activa se elimine
        const lastActiveKey = `${STORAGE_PREFIX}${userId}_last_active_account`;
        localStorage.removeItem(lastActiveKey);
        
        // También eliminamos la cuenta actual global para que no haya problemas de caché
        localStorage.removeItem(CURRENT_ACCOUNT_KEY);
      }

      // Construir los datos de la cuenta como se hacía originalmente
      const accountData: StoredAccountData = {
        accountId: connectionId,
        connectionId: connectionId,
        accountNumber: params.accountNumber || '',
        server: params.server,
        positions: responseData.data.positions || [],
        history: [responseData.data.history || []],
        accountInfo: {
          balance: responseData.data.account.balance || 0,
          equity: responseData.data.account.equity || 0,
          margin: responseData.data.account.margin || 0,
          margin_free: responseData.data.account.margin_free || 0,
          floating_pl: responseData.data.account.floating_pl || 0
        },
        statistics: {
          ...responseData.data.statistics,
          net_profit: responseData.data.statistics?.total_profit || 0,
          profit_factor: 1,
          avg_win: 0,
          avg_loss: 0,
          winning_days: 0,
          losing_days: 0,
          break_even_days: 0,
          day_win_rate: 0
        },
        lastUpdated: new Date().toISOString()
      };

      // Guardar los datos en localStorage
      LocalStorageService.saveAccountData(userId, accountData);

      // Establecer la nueva cuenta como la cuenta activa
      LocalStorageService.setLastActiveAccount(userId, connectionId);
      
      // También actualizar el storage global 
      if (typeof window !== 'undefined' && params.accountNumber) {
        localStorage.setItem(CURRENT_ACCOUNT_KEY, params.accountNumber);
      }
      
      // Notificar a los componentes que escuchan cambios de cuenta
      this.emit('accountChanged', {
        userId,
        connectionId,
        accountNumber: params.accountNumber
      });

      // Convertir la respuesta al formato MT5FullAccountData
      const fullAccountData: MT5FullAccountData = {
        ...responseData.data.account,
        connection_id: connectionId,
        positions: responseData.data.positions.map(pos => ({
          ...pos,
          time: typeof pos.time === 'string' ? parseInt(pos.time, 10) : pos.time
        })) || [],
        deals: responseData.data.history || [],
        statistics: responseData.data.statistics,
        server_time: new Date().toISOString(),
        leverage: responseData.data.account.leverage || 0
      };

      return fullAccountData;
    } catch (error: any) {
      console.error('Error al conectar la cuenta:', error);
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('No se puede conectar al servidor MT5. Por favor, verifica tu conexión a internet y que el servidor esté funcionando.');
      } else if (error.response?.status === 404) {
        throw new Error('Error de conexión: Endpoint no encontrado. Por favor, verifica la configuración del servidor.');
      } else if (error.response?.data?.detail) {
        throw new Error(`Error de conexión: ${error.response.data.detail}`);
      } else {
        throw new Error(error.message || 'Error al conectar con MT5');
      }
    }
  }

  public async disconnect(userId: string, connectionId: string): Promise<void> {
    try {
      
      const response = await this.axiosInstance.post(`/disconnect/${connectionId}`, {
        user_id: userId
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to disconnect account');
      }

      if (connectionId === this.connectionId) {
        this.credentials = null;
        this.userId = null;
        this.connectionId = null;
      }
      
      this.activeConnections.delete(connectionId);

    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(`Disconnect failed: ${error.response.data.detail}`);
      } else {
        throw new Error(error.message || 'Failed to disconnect from MT5');
      }
    }
  }

  private async waitForAccountProcessing(
    userId: string,
    connectionId: string,
    accountNumber: string,
    maxAttempts: number = 30
  ): Promise<MT5FullAccountData> {
        const response = await this.axiosInstance.get(
          `/account-status/${userId}/${connectionId}`,
          {
            params: { account_number: accountNumber }
          }
        );

    if (!response.data.success) {
            throw new Error('Account update failed');
    }

    return response.data.data;
  }

  async updateAccountData(accountNumber: string): Promise<UpdateAccountDataResponse> {
    try {
      
      // Verificar que tenemos un accountNumber válido
      if (!accountNumber) {
        return {
          success: false,
          message: 'No se proporcionó número de cuenta para actualizar',
          data: null as any
        };
      }
      
      // Usar POST en lugar de GET
      const response = await fetch(`${this.baseUrl}/update-account-data/${accountNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
        // No necesitamos enviar un cuerpo para esta petición específica
        // pero mantenemos la estructura correcta para una petición POST
      });
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Error al actualizar datos de cuenta ${accountNumber}:`, errorData);
        
        // Manejar específicamente el error de cuenta no encontrada
        if (errorData.detail && errorData.detail.includes('0 rows')) {
          return {
            success: false,
            message: `La cuenta ${accountNumber} no existe en el servidor. Verifica que la cuenta esté correctamente configurada.`,
            data: null as any
          };
        }
        
        return {
          success: false,
          message: errorData.detail || `Error ${response.status}: ${response.statusText}`,
          data: null as any
        };
      }
      
      // Procesar respuesta exitosa
      const responseData = await response.json();
      
      // Extraer los datos dependiendo de la estructura de respuesta
      let data = responseData;
      
      // Si los datos tienen una estructura anidada con 'data', extraer esa parte
      if (responseData.data && (responseData.data.account || responseData.data.history || responseData.data.statistics)) {
        data = responseData.data;
      }
      
      // Guardar los datos actualizados en localStorage con el formato normalizado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Usar el formato estándar de clave para datos de cuenta
        const storageKey = ACCOUNT_DATA_KEY_FORMAT(accountNumber);
        
        // Normalizar los datos para asegurar una estructura consistente
        const normalizedData = {
          // Datos básicos de identificación
          accountNumber,
          // Si hay cuenta en los datos, extraer información
          ...(data.account ? {
            name: data.account.name || '',
            server: data.account.server || '',
            currency: data.account.currency || 'USD',
            balance: data.account.balance || 0,
            equity: data.account.equity || 0,
            margin: data.account.margin || 0,
            floating_pl: data.account.profit || 0,
          } : {}),
          // Si tenemos statistics, incluirlas directamente
          ...(data.statistics ? { statistics: data.statistics } : {}),
          // Incluir arrays principales
          history: data.history || [],
          positions: data.positions || [],
          // Agregar timestamp
          lastUpdated: new Date().toISOString(),
          // Incluir datos completos
          ...data
        };
     
        
        // Guardar en localStorage
        localStorage.setItem(storageKey, JSON.stringify(normalizedData));
        
        // Actualizar también las claves de cuenta activa
        localStorage.setItem(CURRENT_ACCOUNT_KEY, accountNumber);
        localStorage.setItem(LAST_ACTIVE_ACCOUNT_KEY, accountNumber);
      }
      
      return {
        success: true,
        data: responseData.data || responseData  // Devolver datos originales para compatibilidad
      };
    } catch (error) {
      console.error('❌ Error en updateAccountData:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        data: null as any
      };
    }
  }

  public async getConnectionIdByAccountNumber(accountNumber: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(`/connection-by-account/${accountNumber}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch connection ID');
      }

      return response.data.connection_id;
    } catch (error) {
      console.error('Error fetching connection ID:', error);
      throw error;
    }
  }

  public async getActiveAccount(): Promise<ActiveAccount | null> {
    try {
      // Hacer la llamada al backend para obtener la cuenta activa
      const response = await this.axiosInstance.get('/active-account');
      
      if (response.data && response.data.success) {
        return response.data.account;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo cuenta activa:', error);
      return null;
    }
  }
}

export const mt5Client = MT5Client.getInstance();

export const getAccountInfo = async (
    userId: string,
    connectionId: string,
    credentials: {
        account_number: string;
        password: string;
        server: string;
    }
) => {
    // Usar la misma URL base que la clase MT5Client
    const baseUrl = process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.225.209.243.nip.io';
    
    const response = await fetch(
        `${baseUrl}/account-info/${userId}/${connectionId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        }
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch account info');
    }
    
    return response.json();
}; 