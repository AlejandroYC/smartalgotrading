import { LocalStorageServiceNew } from './LocalStorageServiceNew';

// Definir la interfaz para la conexión MT5
export interface MT5AccountInfo {
  user_id: string;
  account_number: string; 
  password: string;
  server: string;
  platform_type?: string;
}

export class MT5Service {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_MT5_API_URL || '';
  }
  
  // Método para conectar cuenta MT5
  async connectAccount(accountInfo: MT5AccountInfo): Promise<any> {
    try {
      
      const response = await fetch(`${this.apiUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountInfo)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error connecting account');
      }

      const data = await response.json();
      
      // Importante: Guardar la respuesta completa en localStorage
      if (data.success && accountInfo.user_id) {
        
        // Limpiar datos antiguos por seguridad
        localStorage.removeItem('connectionId');
        
        // Usar LocalStorageServiceNew para guardar la respuesta
        LocalStorageServiceNew.saveAccountData(accountInfo.user_id, data);
      }

      return data;
    } catch (error) {
      console.error('Error in connectAccount:', error);
      throw error;
    }
  }
  
  // Método para desconectar una cuenta MT5
  async disconnectAccount(connectionId: string): Promise<boolean> {
    try {
      
      const response = await fetch(`${this.apiUrl}/disconnect/${connectionId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        console.error(`❌ Error disconnecting account: ${response.status}`);
        return false;
      }
      
      // Limpiar localStorage
      localStorage.removeItem('connectionId');
      localStorage.removeItem('accountNumber');
      
      return true;
    } catch (error) {
      console.error('Error in disconnectAccount:', error);
      return false;
    }
  }
  
  // Método para verificar el estado de una cuenta
  async checkAccountStatus(connectionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/account-status/${connectionId}`);
      
      if (!response.ok) {
        console.error(`❌ Error checking account status: ${response.status}`);
        return { success: false };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in checkAccountStatus:', error);
      return { success: false, error: String(error) };
    }
  }
  
  // Método para reparar la inconsistencia entre localStorage y Supabase
  async repairConnectionId(userId: string, correctConnectionId: string): Promise<boolean> {
    try {
      
      // Verificar primero si el ID es válido
      const statusResponse = await this.checkAccountStatus(correctConnectionId);
      
      if (!statusResponse.success) {
        console.error('❌ El connectionId proporcionado no es válido en Supabase');
        return false;
      }
      
      // Actualizar localStorage con el ID correcto
      localStorage.setItem('connectionId', correctConnectionId);
      
      // Si tenemos data de la cuenta, actualizar también el account number
      if (statusResponse.stats && statusResponse.stats.accountNumber) {
        localStorage.setItem('accountNumber', statusResponse.stats.accountNumber);
      }
      
      // Actualizar en LocalStorageServiceNew
      const mockData = {
        connection_id: correctConnectionId,
        success: true
      };
      
      // Usar userId y el connectionId correcto
      LocalStorageServiceNew.saveAccountData(userId, mockData);
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Exportar una instancia singleton del servicio
export const mt5Service = new MT5Service(); 