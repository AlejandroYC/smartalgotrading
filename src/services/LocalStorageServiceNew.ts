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
      console.log('LocalStorageServiceNew.saveAccountData llamado con:', userId, data);
      
      if (!userId || !data) {
        console.error('Datos inválidos para saveAccountData');
        return false;
      }
      
      // Normalizar datos para manejar snake_case y camelCase
      const normalizedData = this.normalizeData(data);
      
      // PRIORIDAD: Usar siempre connectionId del backend si está disponible
      const connectionId = normalizedData.connectionId || normalizedData.connection_id;
      
      // Verificar que tenemos un ID válido
      if (!connectionId) {
        console.error('Error: No hay connectionId en los datos. Usando ID fallback.');
        // Si no hay connectionId, usar un fallback, pero esto es un caso de error
        const fallbackId = normalizedData.accountId || 'manual_trade';
        
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
        
        console.log('Datos guardados con ID fallback');
        return true;
      }
      
      // Si llegamos aquí, tenemos un connectionId válido del backend
      console.log('✅ connectionId encontrado:', connectionId);
      
      // IMPORTANTE: Guardar el connectionId directamente en localStorage
      // para que useAutoUpdate pueda encontrarlo fácilmente
      localStorage.setItem('connectionId', connectionId);
      
      // También guardar el accountNumber para referencia
      if (normalizedData.accountNumber) {
        localStorage.setItem('accountNumber', normalizedData.accountNumber);
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
      
      console.log('Datos guardados correctamente usando connectionId');
      return true;
    } catch (error) {
      console.error('Error en saveAccountData:', error);
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
        console.log('No hay connectionId en localStorage para validar');
        return false;
      }
      
      console.log(`Validando connectionId: ${connectionId}`);
      const response = await fetch(`${apiUrl}/account-status/${connectionId}`);
      
      if (!response.ok) {
        console.error(`Error validando connectionId: ${response.status}`);
        // Si es 404, limpiar el localStorage
        if (response.status === 404) {
          console.warn('ConnectionId no encontrado en el servidor, limpiando localStorage');
          localStorage.removeItem('connectionId');
          localStorage.removeItem('accountNumber');
        }
        return false;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.is_active) {
        console.warn('Conexión encontrada pero inactiva, limpiando localStorage');
        localStorage.removeItem('connectionId');
        localStorage.removeItem('accountNumber');
        return false;
      }
      
      console.log('ConnectionId validado correctamente');
      return true;
    } catch (error) {
      console.error('Error validando connectionId:', error);
      return false;
    }
  }

  // Resto de métodos básicos
  static getUserAccounts(userId: string): Record<string, StoredAccountData> {
    try {
      const key = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
      const storedData = localStorage.getItem(key);
      
      if (!storedData) {
        console.log(`No accounts found for user ${userId}`);
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

  static debugDump(userId: string): void {
    try {
      console.log("===== DEBUG LOCALSTORAGE =====");
      
      // Ver todas las claves en localStorage
      console.log("Todas las claves:");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          console.log(`- ${key}`);
        }
      }
      
      // Ver claves específicas del usuario
      const userKey = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
      const activeKey = `${this.PREFIX}${userId}_${this.LAST_ACTIVE_KEY}`;
      
      console.log(`\nClave de cuentas del usuario: ${userKey}`);
      console.log(`Valor: ${localStorage.getItem(userKey)}`);
      
      console.log(`\nClave de cuenta activa: ${activeKey}`);
      console.log(`Valor: ${localStorage.getItem(activeKey)}`);
      
      // Mostrar datos de la cuenta activa
      const activeAccount = this.getLastActiveAccount(userId);
      if (activeAccount) {
        console.log("\nDatos de la cuenta activa:");
        console.log("ID:", activeAccount.accountId || activeAccount.connectionId);
        console.log("Account Number:", activeAccount.accountNumber);
        console.log("Statistics:", activeAccount.statistics);
        
        if (activeAccount.history) {
          console.log(`History: Array de longitud ${activeAccount.history.length}`);
          if (activeAccount.history.length > 0) {
            console.log(`Primer elemento es array: ${Array.isArray(activeAccount.history[0])}`);
            const trades = Array.isArray(activeAccount.history[0]) ? 
                           activeAccount.history[0].length : 
                           'N/A';
            console.log(`Cantidad de trades: ${trades}`);
          }
        }
      } else {
        console.log("\nNo hay cuenta activa");
      }
      
      console.log("===== FIN DEBUG =====");
    } catch (error) {
      console.error("Error en debugDump:", error);
    }
  }
} 