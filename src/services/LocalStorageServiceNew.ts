// Archivo temporal para reemplazar el servicio actual
export interface StoredAccountData {
  accountId: string;
  connectionId?: string;
  accountNumber?: string;
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

// Tipo para los registros de cuentas en localStorage
interface AccountsRecord {
  [key: string]: StoredAccountData;
}

export class LocalStorageServiceNew {
  private static PREFIX = 'smartalgo_';
  private static USER_ACCOUNTS_KEY = 'user_accounts';
  private static LAST_ACTIVE_KEY = 'last_active_account';

  /**
   * Normaliza los nombres de propiedades entre el backend (snake_case) y 
   * el frontend (camelCase)
   */
  private static normalizeData(data: any): any {
    const normalizedData = { ...data };
    
    // Normalizar connectionId/connection_id
    if (normalizedData.connection_id && !normalizedData.connectionId) {
      normalizedData.connectionId = normalizedData.connection_id;
    }
    
    // Normalizar accountNumber/account_number
    if (normalizedData.account_number && !normalizedData.accountNumber) {
      normalizedData.accountNumber = normalizedData.account_number;
    }
    
    return normalizedData;
  }

  // Método crucial que falta
  static saveAccountData(userId: string, data: any): boolean {
    try {
      
      if (!userId || !data) {
        return false;
      }
      
      // Normalizar datos para manejar snake_case y camelCase
      const normalizedData = this.normalizeData(data);
      
      // PRIORIDAD: Usar siempre connectionId del backend si está disponible
      const connectionId = normalizedData.connectionId || normalizedData.connection_id;
      
      // Verificar que tenemos un ID válido
      if (!connectionId) {
        // Si no hay connectionId, usar un fallback, pero esto es un caso de error
        const fallbackId = normalizedData.accountId || normalizedData.accountNumber || 'manual_trade';
        
        // Si estamos usando un fallback, loguear para diagnóstico
        console.warn('⚠️ Usando ID fallback en lugar de connectionId:', fallbackId);
        console.warn('Datos originales:', JSON.stringify(normalizedData));
        
        // Guardar en localStorage la estructura específica para la cuenta
        const key = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
        let accounts: AccountsRecord = {};
        
        try {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            accounts = JSON.parse(storedData);
          }
        } catch (e) {
          console.error('Error al leer cuentas existentes:', e);
        }
        
        // Añadir/actualizar datos
        accounts[fallbackId] = normalizedData as StoredAccountData;
        
        // Guardar en localStorage
        localStorage.setItem(key, JSON.stringify(accounts));
        
        // Establecer como cuenta activa
        this.setLastActiveAccount(userId, fallbackId);
        
        // IMPORTANTE: Guardar también con la clave específica para esta cuenta
        const accountStorageKey = `${this.PREFIX}${fallbackId}_account_data`;
        localStorage.setItem(accountStorageKey, JSON.stringify(normalizedData));
        
        // IMPORTANTE: También guardar como smartalgo_last_active_account para compatibilidad
        localStorage.setItem('smartalgo_last_active_account', fallbackId);
        
        return true;
      }
      
      // Si llegamos aquí, tenemos un connectionId válido del backend
      
      // IMPORTANTE: Guardar el connectionId directamente en localStorage
      // para que useAutoUpdate pueda encontrarlo fácilmente
      localStorage.setItem('connectionId', connectionId);
      
      // También guardar el accountNumber para referencia
      if (normalizedData.accountNumber) {
        localStorage.setItem('accountNumber', normalizedData.accountNumber);
        
        // IMPORTANTE: Guardar también con la clave específica para esta cuenta
        const accountStorageKey = `${this.PREFIX}${normalizedData.accountNumber}_account_data`;
        localStorage.setItem(accountStorageKey, JSON.stringify(normalizedData));
        
        // IMPORTANTE: También guardar como smartalgo_last_active_account para compatibilidad
        localStorage.setItem('smartalgo_last_active_account', normalizedData.accountNumber);
      }
      
      // Asegurarnos de que connectionId esté en los datos normalizados
      normalizedData.connectionId = connectionId;
      
      // Guardar en localStorage la estructura específica para la cuenta
      const key = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
      let accounts: AccountsRecord = {};
      
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          accounts = JSON.parse(storedData);
        }
      } catch (e) {
        console.error('Error al leer cuentas existentes:', e);
      }
      
      // Añadir/actualizar datos usando connectionId como clave
      accounts[connectionId] = normalizedData as StoredAccountData;
      
      // Guardar en localStorage
      localStorage.setItem(key, JSON.stringify(accounts));
      
      // Establecer como cuenta activa
      this.setLastActiveAccount(userId, connectionId);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Valida si el connectionId en localStorage es válido y coincide con Supabase
   * @param apiUrl URL base de la API de MT5
   */
  static async validateConnectionId(apiUrl: string): Promise<boolean> {
    try {
      const connectionId = localStorage.getItem('connectionId');
      
      if (!connectionId) {
        return false;
      }
      
      const response = await fetch(`${apiUrl}/account-status/${connectionId}`);
      
      if (!response.ok) {
        // Si es 404, limpiar el localStorage
        if (response.status === 404) {
          localStorage.removeItem('connectionId');
          localStorage.removeItem('accountNumber');
        }
        return false;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.is_active) {
        localStorage.removeItem('connectionId');
        localStorage.removeItem('accountNumber');
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Resto de métodos básicos
  static getUserAccounts(userId: string): Record<string, StoredAccountData> {
    try {
      const key = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
      const storedData = localStorage.getItem(key);
      
      if (!storedData) {
        return {};
      }
      
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error getting user accounts:', error);
      return {};
    }
  }

  static getLastActiveAccount(userId: string): StoredAccountData | null {
    try {
      const accountId = this.getLastActiveAccountId(userId);
      if (!accountId) {
        const accounts = this.getUserAccounts(userId);
        const ids = Object.keys(accounts);
        if (ids.length > 0) {
          return accounts[ids[0]];
        }
        return null;
      }
      
      const accounts = this.getUserAccounts(userId);
      return accounts[accountId] || null;
    } catch (error) {
      console.error('Error getting last active account:', error);
      return null;
    }
  }

  static getLastActiveAccountId(userId: string): string | null {
    try {
      const key = `${this.PREFIX}${userId}_${this.LAST_ACTIVE_KEY}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting last active account ID:', error);
      return null;
    }
  }

  static setLastActiveAccount(userId: string, accountId: string): void {
    try {
      const key = `${this.PREFIX}${userId}_${this.LAST_ACTIVE_KEY}`;
      localStorage.setItem(key, accountId);
    } catch (error) {
      console.error('Error setting last active account:', error);
    }
  }
}
