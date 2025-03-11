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

export class LocalStorageServiceNew {
  private static PREFIX = 'smartalgo_';
  private static USER_ACCOUNTS_KEY = 'user_accounts';
  private static LAST_ACTIVE_KEY = 'last_active_account';

  // Método crucial que falta
  static saveAccountData(userId: string, data: any): boolean {
    try {
      console.log('LocalStorageServiceNew.saveAccountData llamado con:', userId, data);
      
      if (!userId || !data) {
        console.error('Datos inválidos para saveAccountData');
        return false;
      }
      
      // Determinar accountId
      const accountId = data.accountId || data.connectionId || 'manual_trade';
      
      // Guardar en localStorage
      const key = `${this.PREFIX}${userId}_${this.USER_ACCOUNTS_KEY}`;
      let accounts = {};
      
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          accounts = JSON.parse(storedData);
        }
      } catch (e) {
        console.error('Error al leer cuentas existentes:', e);
      }
      
      // Añadir/actualizar datos
      accounts[accountId] = data;
      
      // Guardar en localStorage
      localStorage.setItem(key, JSON.stringify(accounts));
      
      // Establecer como cuenta activa
      this.setLastActiveAccount(userId, accountId);
      
      console.log('Datos guardados correctamente por LocalStorageServiceNew');
      return true;
    } catch (error) {
      console.error('Error en saveAccountData:', error);
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