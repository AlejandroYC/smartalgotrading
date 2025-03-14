// Tipos que necesitamos
import { MT5Stats } from '@/types/metatrader';

export interface StoredAccountData {
  accountId: string;
  connectionId?: string;
  accountNumber?: string;
  server?: string;
  positions?: any[];
  history?: any[][];
  closedTrades?: any[];
  deals?: any[];
  accountInfo?: {
    balance: number;
    equity: number;
    margin: number;
    margin_free: number;
    floating_pl: number;
  };
  statistics?: {
    net_profit: number;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    profit_factor: number;
    avg_win: number;
    avg_loss: number;
    winning_days: number;
    losing_days: number;
    break_even_days: number;
    day_win_rate: number;
    daily_results?: Record<string, any>;
  };
  lastUpdated?: string;
}

export class LocalStorageService {
  private static PREFIX = 'smartalgo_';
  private static USER_ACCOUNTS_KEY = 'user_accounts';
  private static LAST_ACTIVE_KEY = 'last_active_account';

  // Buscar todas las entradas que podrían contener datos de cuenta
  static findAllAccountData(): Record<string, any> {
    try {
      const allData = {};
      
      // Buscar en todo el localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              // Intentar parsear como JSON
              const parsedValue = JSON.parse(value);
              
              // Verificar si parece una cuenta (buscar connectionId o accountId)
              if (parsedValue && (parsedValue.connectionId || parsedValue.accountId)) {
                allData[key] = parsedValue;
              }
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }
      
      return allData;
    } catch (error) {
      console.error('Error scanning localStorage:', error);
      return {};
    }
  }

  // Método que falta para AddTradeModal.tsx
  static saveAccountData(userId: string, responseData: any): boolean {
    try {
      
      // Verificar si hay datos
      if (!userId || !responseData) {
        return false;
      }
      
      // Determinar el accountId
      const accountId = responseData.connection_id || responseData.accountId || responseData.id;
      if (!accountId) {
        return false;
      }
      
      return this.updateAccountData(userId, accountId, responseData);
    } catch (error) {
      console.error("Error en saveAccountData:", error);
      return false;
    }
  }

  // Método para obtener todas las cuentas de un usuario
  static getUserAccounts(userId: string): Record<string, StoredAccountData> {
    try {
      const key = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
      const storedData = localStorage.getItem(key);
      
      if (!storedData) {
        return {};
      }
      
      const accounts = JSON.parse(storedData);
      return accounts;
    } catch (error) {
      return {};
    }
  }

  // Método para obtener una cuenta específica
  static getAccountData(userId: string, accountId: string): StoredAccountData | null {
    try {
      const accounts = this.getUserAccounts(userId);
      if (accounts && accounts[accountId]) {
        return accounts[accountId];
      }
      return null;
    } catch (error) {
      console.error(`Error getting account ${accountId}:`, error);
      return null;
    }
  }

  // Normalizar datos de cuenta - para mantener consistencia
  private static normalizeAccountData(data: any): StoredAccountData {
    // Detectar si es una respuesta del backend o un objeto ya guardado
    const isBackendResponse = data.data && data.connection_id;
    
    if (isBackendResponse) {
      return this.convertBackendResponse(data);
    }
    
    // Asegurar que tenemos un ID de cuenta
    const accountId = data.accountId || data.connectionId || 'unknown';
    
    return {
      accountId: accountId,
      connectionId: data.connectionId || data.connection_id || accountId,
      accountNumber: data.accountNumber || data.account || '',
      server: data.server || '',
      
      // Asegurar que history sea array de arrays
      history: Array.isArray(data.history) ? 
               (Array.isArray(data.history[0]) ? data.history : [data.history]) : 
               [],
      
      // Otras propiedades
      positions: Array.isArray(data.positions) ? data.positions : [],
      closedTrades: Array.isArray(data.closedTrades) ? data.closedTrades : [],
      deals: Array.isArray(data.deals) ? data.deals : [],
      
      accountInfo: {
        balance: parseFloat(data.accountInfo?.balance || data.balance || '0'),
        equity: parseFloat(data.accountInfo?.equity || data.equity || '0'),
        margin: parseFloat(data.accountInfo?.margin || data.margin || '0'),
        margin_free: parseFloat(data.accountInfo?.margin_free || data.margin_free || '0'),
        floating_pl: parseFloat(data.accountInfo?.floating_pl || data.floating_pl || '0'),
      },
      
      statistics: data.statistics || {
        net_profit: 0,
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        profit_factor: 1,
        avg_win: 0,
        avg_loss: 0,
        winning_days: 0,
        losing_days: 0,
        break_even_days: 0,
        day_win_rate: 0,
        daily_results: {}
      },
      
      lastUpdated: data.lastUpdated || new Date().toISOString()
    };
  }

  // Convertir respuesta del backend a formato normalizado
  private static convertBackendResponse(response: any): StoredAccountData {
    const connectionId = response.connection_id;
    const data = response.data || {};
    
    return {
      accountId: connectionId,
      connectionId: connectionId,
      accountNumber: data.account?.login?.toString() || '',
      server: data.account?.server || response.server || '',
      
      // Convertir history a formato esperado
      history: Array.isArray(data.history) ? [data.history] : [],
      
      positions: Array.isArray(data.positions) ? data.positions : [],
      
      accountInfo: {
        balance: parseFloat(data.account?.balance || '0'),
        equity: parseFloat(data.account?.equity || '0'),
        margin: parseFloat(data.account?.margin || '0'),
        margin_free: parseFloat(data.account?.margin_free || '0'),
        floating_pl: parseFloat(data.account?.profit || '0'),
      },
      
      statistics: {
        net_profit: parseFloat(data.statistics?.net_profit || '0'),
        total_trades: parseInt(data.statistics?.total_trades || '0', 10),
        winning_trades: parseInt(data.statistics?.winning_trades || '0', 10),
        losing_trades: parseInt(data.statistics?.losing_trades || '0', 10),
        win_rate: parseFloat(data.statistics?.win_rate || '0'),
        profit_factor: parseFloat(data.statistics?.profit_factor || '1'),
        avg_win: parseFloat(data.statistics?.avg_win || '0'),
        avg_loss: parseFloat(data.statistics?.avg_loss || '0'),
        winning_days: parseInt(data.statistics?.winning_days || '0', 10),
        losing_days: parseInt(data.statistics?.losing_days || '0', 10),
        break_even_days: parseInt(data.statistics?.break_even_days || '0', 10),
        day_win_rate: parseFloat(data.statistics?.day_win_rate || '0'),
        daily_results: data.statistics?.daily_results || {}
      },
      
      lastUpdated: new Date().toISOString()
    };
  }

  // Método para actualizar o guardar datos de una cuenta
  static updateAccountData(userId: string, accountId: string, data: any): boolean {
    try {
      // Validar datos mínimos requeridos
      if (!data || !accountId) {
        console.error('Datos de cuenta o accountId inválidos');
        return false;
      }
      
    
      
      // Asegurarse de que tenga la estructura correcta
      const validatedData: StoredAccountData = {
        accountId: accountId,
        connectionId: data.connection_id || data.connectionId || accountId,
        accountNumber: data.accountNumber || data.account_number || '',
        server: data.server || '',  // Asegurarnos de incluir el server
        positions: Array.isArray(data.positions) ? data.positions : [],
        history: Array.isArray(data.history) ? 
               (Array.isArray(data.history[0]) ? data.history : [data.history]) : 
               [],
        closedTrades: Array.isArray(data.closedTrades) ? data.closedTrades : [],
        deals: Array.isArray(data.deals) ? data.deals : [],
        
        accountInfo: {
          balance: parseFloat(data.accountInfo?.balance || data.balance || data.account?.balance || '0'),
          equity: parseFloat(data.accountInfo?.equity || data.equity || data.account?.equity || '0'),
          margin: parseFloat(data.accountInfo?.margin || data.margin || data.account?.margin || '0'),
          margin_free: parseFloat(data.accountInfo?.margin_free || data.margin_free || data.account?.margin_free || '0'),
          floating_pl: parseFloat(data.accountInfo?.floating_pl || data.floating_pl || data.account?.profit || '0'),
        },
        
        statistics: data.statistics || {
          net_profit: parseFloat(data.net_profit || '0'),
          total_trades: parseInt(data.total_trades || '0', 10),
          winning_trades: parseInt(data.winning_trades || '0', 10),
          losing_trades: parseInt(data.losing_trades || '0', 10),
          win_rate: parseFloat(data.win_rate || '0'),
          profit_factor: parseFloat(data.profit_factor || '1'),
          avg_win: parseFloat(data.avg_win || '0'),
          avg_loss: parseFloat(data.avg_loss || '0'),
          winning_days: parseInt(data.winning_days || '0', 10),
          losing_days: parseInt(data.losing_days || '0', 10),
          break_even_days: parseInt(data.break_even_days || '0', 10),
          day_win_rate: parseFloat(data.day_win_rate || '0'),
          daily_results: data.daily_results || {}
        },
        
        lastUpdated: new Date().toISOString()
      };

  
      
      // Obtener cuentas existentes
      const key = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
      const accounts = this.getUserAccounts(userId) || {};
      
      // Actualizar la cuenta específica
      accounts[accountId] = validatedData;
      
      // Guardar de vuelta en localStorage
      localStorage.setItem(key, JSON.stringify(accounts));
      
      // Actualizar la última cuenta activa
      this.setLastActiveAccount(userId, accountId);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Establecer última cuenta activa
  static setLastActiveAccount(userId: string, accountId: string): void {
    try {
      const key = `${this.PREFIX}${userId}_${this.LAST_ACTIVE_KEY}`;
      localStorage.setItem(key, accountId);
    } catch (error) {
      console.error('Error setting last active account:', error);
    }
  }

  // Obtener ID de la última cuenta activa
  static getLastActiveAccountId(userId: string): string | null {
    try {
      const key = `${this.PREFIX}${userId}_${this.LAST_ACTIVE_KEY}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting last active account ID:', error);
      return null;
    }
  }

  // Obtener última cuenta activa completa
  static getLastActiveAccount(userId: string): StoredAccountData | null {
    try {
      const accountId = this.getLastActiveAccountId(userId);
      if (!accountId) {
        // Si no hay cuenta activa, buscar cualquier cuenta
        const accounts = this.getUserAccounts(userId);
        const accountIds = Object.keys(accounts);
        
        if (accountIds.length > 0) {
          return accounts[accountIds[0]];
        }
        
        return null;
      }
      
      return this.getAccountData(userId, accountId);
    } catch (error) {
      console.error('Error getting last active account:', error);
      return null;
    }
  }

  // Verificar si los datos necesitan actualización (más de 30 minutos)
  static needsUpdate(data: StoredAccountData): boolean {
    if (!data.lastUpdated) return true;
    
    const lastUpdate = new Date(data.lastUpdated);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    return minutesSinceUpdate > 30;
  }
  
  // Limpiar datos de cuentas
  static clearUserAccounts(userId: string): void {
    localStorage.removeItem(`mt5_accounts_${userId}`);
    localStorage.removeItem(`mt5_last_active_${userId}`);
  }
  
  // Método de diagnóstico
  static testStorage(): boolean {
    try {
      localStorage.setItem('test_key', 'test_value');
      const testValue = localStorage.getItem('test_key');
      localStorage.removeItem('test_key');
      return testValue === 'test_value';
    } catch (e) {
      console.error("Error en test de localStorage:", e);
      return false;
    }
  }
} 