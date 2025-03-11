import axios, { AxiosInstance } from 'axios';
import { MT5AccountInfo, MT5Position, MT5HistoricalData } from '@/types/metatrader';
import { MT5Config } from './config';
import { toast } from 'react-hot-toast';
import { EventEmitter } from 'events';
import { LocalStorageService, StoredAccountData } from '@/services/LocalStorageService';

export interface MT5ConnectionParams {
  connection_id: string;
  accountNumber: string;
  password: string;
  server: string;
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

class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 30000; // 30 segundos

  async execute(fn: () => Promise<any>) {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private isOpen() {
    if (this.failures >= this.threshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailure;
      if (timeSinceLastFailure < this.resetTimeout) {
        return true;
      }
      this.reset();
    }
    return false;
  }

  private recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
  }

  private reset() {
    this.failures = 0;
    this.lastFailure = 0;
  }
}

export class MT5Client extends EventEmitter {
  private static instance: MT5Client;
  private baseUrl: string;
  private readonly axiosInstance: AxiosInstance;
  private userId: string | null = null;
  private connectionId: string | null = null;
  private rateLimiter = {
    lastRequest: 0,
    minInterval: 100 // 100ms entre solicitudes
  };
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isConnecting: boolean = false;
  private credentials: MT5ConnectionParams | null = null;
  private updateInterval: number = 30 * 60 * 1000; // 30 minutos entre actualizaciones
  private activeConnections: Map<string, {
    connectionId: string;
    accountNumber: string;
    server: string;
    lastUpdate: number;
    cachedData: MT5FullAccountData | null;
  }> = new Map();

  private constructor() {
    super();
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

    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
          console.log('Network error detected, retrying...', error.config.url);
          try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await this.axiosInstance.request(error.config);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            throw new Error('Unable to connect to MT5 server. Please check your internet connection and try again.');
          }
        }
        throw error;
      }
    );

    console.log('MT5Client initialized with:', {
      apiUrl: this.baseUrl,
      timeout: 30000
    });
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
      console.log('Intentando conectar cuenta MT5:', {
        userId,
        connectionId: params.connection_id,
        server: params.server
      });

      const response = await this.axiosInstance.post('/connect', {
        user_id: userId,
        account_number: params.accountNumber,
        password: params.password,
        server: params.server,
        platform_type: "MT5",
        connection_id: params.connection_id
      }, {
        timeout: 60000 // Aumentamos el timeout a 60 segundos
      });

      console.log('Respuesta del servidor:', response.data);

      if (!response.data || !response.data.success) {
        const errorMsg = response.data?.error || response.data?.detail || 'Error al conectar la cuenta';
        console.error('Error en la respuesta:', errorMsg);
        throw new Error(errorMsg);
      }

      this.credentials = params;
      this.userId = userId;
      this.connectionId = params.connection_id;

      const accountData = response.data.data;
      console.log('Datos de cuenta recibidos correctamente');

      // Desconectamos después de obtener los datos
      await this.disconnect(userId, params.connection_id);

      return accountData;
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

      this.stopPeriodicUpdate(connectionId);
      
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
    maxAttempts: number = 30  // 30 intentos = 60 segundos
  ): Promise<MT5FullAccountData> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.axiosInstance.get(
          `/account-status/${userId}/${connectionId}`,
          {
            params: { account_number: accountNumber }
          }
        );

        if (response.data.success) {
          if (response.data.status === 'completed') {
            return response.data.data;
          } else if (response.data.status === 'not_found') {
            throw new Error('Account update failed');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error('Error checking account status:', error);
        throw error;
      }
    }

    throw new Error('Timeout waiting for account update');
  }

  private async startPeriodicUpdate(
    userId: string,
    connectionId: string,
    credentials: MT5ConnectionParams
  ): Promise<void> {
    this.stopPeriodicUpdate(connectionId);
    
    const interval = setInterval(async () => {
      try {
        console.log(`Requesting periodic update for account ${credentials.accountNumber}`);
        
        const response = await this.axiosInstance.post(
          `/account-info/${userId}/${connectionId}`,
          {
            accountNumber: credentials.accountNumber,
            password: credentials.password,
            server: credentials.server
          }
        );
        
        if (response.data.success) {
          if (response.data.cached) {
            this.emit('account_update', response.data.data);
          }
        } else {
          console.error('Failed to update account:', response.data.error);
        }
      } catch (error) {
        console.error('Error in periodic update:', error);
      }
    }, this.updateInterval);
    
    this.updateIntervals.set(connectionId, interval);
  }

  private stopPeriodicUpdate(connectionId: string): void {
    const interval = this.updateIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(connectionId);
    }
  }

  public async getAccountStatus(userId: string, connectionId: string): Promise<AccountStatusResponse> {
    try {
      const response = await this.axiosInstance.get(
        `/account-status/${userId}/${connectionId}`
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      return {
        success: false,
        data: {} as MT5Stats,
        message: 'Failed to get account status'
      };
    }
  }

  async getHistoricalData(
    connectionId: string,
    fromDate: string,
    toDate: string
  ): Promise<any> {
    const response = await this.axiosInstance.get(
      `/historical-data/${connectionId}`,
      { params: { from_date: fromDate, to_date: toDate } }
    );
    return response.data;
  }

  async switchAccount(
    userId: string,
    connectionId: string,
    credentials: {
      account_number: string;
      password: string;
      server: string;
    }
  ): Promise<any> {
    try {
      if (!credentials.account_number) {
        throw new Error('Account number is required');
      }
      if (!credentials.password) {
        throw new Error('Password is required');
      }
      if (!credentials.server) {
        throw new Error('Server is required');
      }

      const normalizedAccountNumber = credentials.account_number.toString();

      console.log('Switching account with params:', {
        userId,
        connectionId,
        server: credentials.server,
        account: normalizedAccountNumber
      });

      const response = await this.axiosInstance.post(
        `/switch-account/${userId}/${connectionId}`,
        {
          accountNumber: normalizedAccountNumber,
          password: credentials.password,
          server: credentials.server,
          mt5_path: "C:\\Program Files\\MetaTrader 5\\terminal64.exe"
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to switch account');
      }

      try {
        await this.connectAccount(userId, {
          accountNumber: normalizedAccountNumber,
          password: credentials.password,
          server: credentials.server,
          connection_id: connectionId
        });
      } catch (wsError) {
        console.warn('WebSocket connection failed, but HTTP connection was successful:', wsError);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error in switchAccount:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  public async reconnect(userId: string, accountId: string): Promise<void> {
    try {
      this.isConnecting = false;
      await this.connectAccount(userId, {
        accountNumber: this.credentials?.accountNumber || '',
        password: this.credentials?.password || '',
        server: this.credentials?.server || '',
        connection_id: accountId
      });
      console.log('✅ Reconnected successfully');
    } catch (error) {
      console.error('❌ Error reconnecting:', error);
      throw error;
    }
  }

  public cleanup(): void {
    console.log('🧹 Cleaning up connections...');
    for (const [connectionId, interval] of this.updateIntervals) {
      clearInterval(interval);
      this.updateIntervals.delete(connectionId);
    }
    this.cache.clear();
    this.activeConnections.clear();
    this.isConnecting = false;
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
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_MT5_API_URL}/account-info/${userId}/${connectionId}`,
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