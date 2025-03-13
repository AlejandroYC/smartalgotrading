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
    console.log('🔍 Valor de NEXT_PUBLIC_MT5_API_URL:', process.env.NEXT_PUBLIC_MT5_API_URL);
    
    this.baseUrl = process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.225.209.243.nip.io';
    
    console.log('MT5Client inicializado con baseUrl:', this.baseUrl);
    
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

  public static getInstance(): MT5Client {
    if (!MT5Client.instance) {
      MT5Client.instance = new MT5Client();
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
    
    const accounts = LocalStorageService.getUserAccounts(userId);
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
        connectionId: freshData.connection_id,
        accountInfo: freshData.data.account,
        positions: freshData.data.positions,
        history: freshData.data.history,
        statistics: freshData.data.statistics,
        platformType: "mt5",
        accountNumber,
        server: accountDetails.server,
        lastUpdated: new Date().toISOString()
      };
      
      LocalStorageService.saveAccountData(userId, accountNumber, newStoredData);
      
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
      
      // Depurar parámetros recibidos
      console.log('connectAccount - Parámetros recibidos:', { 
        userId, 
        accountNumber: params.accountNumber, 
        server: params.server, 
        passwordLength: params.password ? params.password.length : 0 
      });
      
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

      console.log('📡 Respuesta recibida de la API:', response.status, response.data);

      const responseData = response.data;
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to connect account');
      }

      // Si el backend indica que debemos limpiar el localStorage
      if (responseData.should_clear_storage) {
        console.log('🧹 Limpiando localStorage antes de guardar nuevos datos...');
        // Obtener todas las keys que empiezan con smartalgo_
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('smartalgo_')) {
            console.log('Eliminando:', key);
            localStorage.removeItem(key);
          }
        });
      }

      // Asegurarnos de que tenemos todos los datos necesarios
      const connectionId = responseData.connection_id;
      if (!connectionId) {
        throw new Error('No se recibió connection_id del servidor');
      }

      // Guardar los datos en localStorage
      console.log('💾 Guardando datos en localStorage:', {
        connectionId,
        accountNumber: params.accountNumber,
        server: params.server
      });

      const accountData = {
        accountId: connectionId,
        connectionId: connectionId,
        accountNumber: params.accountNumber,
        server: params.server,
        positions: responseData.data.positions || [],
        history: Array.isArray(responseData.data.history?.[0]) 
            ? responseData.data.history.flat() 
            : responseData.data.history || [],
        accountInfo: {
          balance: responseData.data.account.balance || 0,
          equity: responseData.data.account.equity || 0,
          margin: responseData.data.account.margin || 0,
          margin_free: responseData.data.account.margin_free || 0,
          floating_pl: responseData.data.account.floating_pl || 0
        },
        statistics: responseData.data.statistics,
        lastUpdated: new Date().toISOString()
      };

      console.log('📦 Datos completos a guardar:', accountData);

      const saved = LocalStorageService.saveAccountData(userId, accountData);
      if (!saved) {
        console.error('❌ Error al guardar datos en localStorage');
      }

      LocalStorageService.setLastActiveAccount(userId, connectionId);

      // Convertir la respuesta al formato MT5FullAccountData
      const fullAccountData: MT5FullAccountData = {
        ...responseData.data.account,
        connection_id: connectionId,
        positions: responseData.data.positions.map(pos => ({
          ...pos,
          time: typeof pos.time === 'string' ? parseInt(pos.time, 10) : pos.time
        })) || [],
        deals: responseData.data.history || [],
        statistics: responseData.data.statistics
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
      console.log('Disconnecting account:', connectionId);
      
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

      console.log('Account disconnected successfully');
    } catch (error: any) {
      console.error('Error disconnecting account:', error);
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

  public async updateAccountData(accountNumber: string): Promise<MT5ConnectResponse> {
    try {
        console.log('📡 Solicitando actualización para cuenta:', accountNumber);
        
        const response = await this.axiosInstance.post<MT5ConnectResponse>(
            `/update-account-data/${accountNumber}`
        );
        
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to update account data');
        }
        
        const responseData = response.data;
        
        // Aplanar el historial si viene en chunks
        let flatHistory: any[] = [];
        if (Array.isArray(responseData.data.history)) {
            // Si es un array de arrays, aplanarlo
            if (Array.isArray(responseData.data.history[0])) {
                flatHistory = responseData.data.history.flat();
            } else {
                flatHistory = responseData.data.history;
            }
        }

        console.log('📊 Trades procesados:', flatHistory.length);
        
        const accountData = {
            accountId: responseData.connection_id,
            connectionId: responseData.connection_id,
            accountNumber: accountNumber,
            server: responseData.data.account.server,
            accountInfo: {
                balance: responseData.data.account.balance || 0,
                equity: responseData.data.account.equity || 0,
                margin: responseData.data.account.margin || 0,
                margin_free: responseData.data.account.margin_free || 0,
                floating_pl: responseData.data.account.floating_pl || 0
            },
            history: flatHistory,
            positions: responseData.data.positions || [],
            statistics: responseData.data.statistics,
            lastUpdated: new Date().toISOString()
        };

        // Guardar en localStorage usando la clave correcta
        const userAccountsKey = `smartalgo_${accountNumber}_account_data`;
        try {
            localStorage.setItem(userAccountsKey, JSON.stringify(accountData));
            console.log('✅ Datos guardados correctamente en localStorage:', {
                tradesCount: flatHistory.length,
                positionsCount: accountData.positions.length,
                balance: accountData.accountInfo.balance
            });
            
            localStorage.setItem('smartalgo_last_active_account', accountNumber);
        } catch (storageError) {
            console.error('❌ Error al guardar en localStorage:', storageError);
      }

      return response.data;
    } catch (error: any) {
        console.error('❌ Error actualizando datos:', error);
        throw new Error(error.message || 'Failed to update account data');
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
    console.log('🔍 Usando baseUrl para getAccountInfo:', baseUrl);
    
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