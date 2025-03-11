'use client';
import React, { useState, FormEvent } from 'react';
import Image from 'next/image';
import metatrader4Img from '../images/metatrader4.png';
import metatrader5Img from '../images/metatrader5.png';
import { MT5Client } from '@/services/mt5/mt5Client';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/db';
import { encrypt } from '@/utils/encryption';
import { MT5Stats } from '@/types/metatrader';
import { AccountStatusResponse } from '@/services/mt5/mt5Client';
import { toast } from 'react-hot-toast';
import { LocalStorageServiceNew as LocalStorageService } from '@/services/LocalStorageServiceNew';

interface MTConnectionForm {
  server: string;
  account_number: string;
  password: string;
}

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountConnected?: (accountData: any) => void;
}

const encryptPassword = async (password: string): Promise<string> => {
  return encrypt(password);
};

const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, onAccountConnected }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<'mt4' | 'mt5' | null>(null);
  const [formData, setFormData] = useState<MTConnectionForm>({
    server: '',
    account_number: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    accountInfo?: any;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit ejecutándose");
    
    // Test básico de localStorage
    try {
      localStorage.setItem('test_key', 'test_value');
      console.log("Test básico de localStorage exitoso");
    } catch (error) {
      console.error("Error al usar localStorage:", error);
    }
    
    setError(null);
    setIsSubmitting(true);

    const toastId = 'mt5-connection';
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const connection_id = crypto.randomUUID();
      const mt5Client = MT5Client.getInstance();

      toast.loading('Connecting to MT5...', { id: toastId });

      const connectionResult = await mt5Client.connectAccount(user.id, {
        accountNumber: formData.account_number,
        password: formData.password,
        server: formData.server,
        connection_id: connection_id
      });

      console.log("connectionResult recibido:", connectionResult);
      console.log("¿Existe connectionResult.data?", !!connectionResult.data);
      if (connectionResult.data) {
        console.log("Estructura de connectionResult.data:", Object.keys(connectionResult.data));
      }

      console.log("DATOS COMPLETOS:", JSON.stringify(connectionResult, null, 2));

      // Verificar la estructura exacta
      console.log("Tipo de connectionResult:", typeof connectionResult);
      console.log("Estructura principal:", Object.keys(connectionResult));

      if (connectionResult.data) {
        console.log("Estructura de data:", Object.keys(connectionResult.data));
      } else if (connectionResult.account) {
        console.log("Estructura directa:", Object.keys(connectionResult));
      }

      console.log("Datos recibidos de MT5Client:", connectionResult);

      if (connectionResult) {
        console.log("Estructura de datos recibida:", Object.keys(connectionResult));
        
        // Los datos ya vienen con la estructura correcta de mt5Client.ts
        // No necesitamos extraer de connectionResult.data
        const accountData = {
          connectionId: connection_id,
          accountInfo: connectionResult.account || {},
          positions: connectionResult.positions || [],
          history: connectionResult.history || [],
          statistics: connectionResult.statistics || {},
          platformType: selectedPlatform || "mt5",
          accountNumber: formData.account_number,
          server: formData.server,
          lastUpdated: new Date().toISOString()
        };
        
        console.log("Datos preparados para localStorage:", accountData);
        
        // Guardar directamente sin llamar a saveAccountData
        if (user.id) {
          const accountId = accountData.connectionId || 'manual_trades';
          
          // Guardar directamente sin llamar a saveAccountData
          const key = `smartalgo_${user.id}_user_accounts`;
          let accounts = {};
          
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              accounts = JSON.parse(stored);
            }
          } catch (e) {
            console.error("Error parsing stored accounts:", e);
          }
          
          // Añadir o actualizar la cuenta
          accounts[accountId] = accountData;
          
          // Guardar de vuelta
          localStorage.setItem(key, JSON.stringify(accounts));
          
          // Establecer como cuenta activa
          localStorage.setItem(`smartalgo_${user.id}_last_active_account`, accountId);
          
          console.log("Datos guardados manualmente en localStorage");
        }
      } else {
        console.error("connectionResult es null o undefined");
      }

      setConnectionStatus({
        connected: true,
        accountInfo: connectionResult
      });

      toast.dismiss(toastId);
      toast.success('Account connected and data retrieved successfully', {
        duration: 3000,
      });

      if (onAccountConnected) {
        console.log("Datos enviados a componente padre:", {
          ...connectionResult,
          connection_id,
          account_number: formData.account_number,
          server: formData.server,
          platform_type: "MT5"
        });
        
        onAccountConnected({
          ...connectionResult,
          connection_id,
          account_number: formData.account_number,
          server: formData.server,
          platform_type: "MT5"
        });
      }

      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error: any) {
      console.error('Connection error:', error);
      setError(error.message);
      setConnectionStatus({
        connected: false,
        accountInfo: undefined
      });
      toast.dismiss(toastId);
      toast.error(error.message, {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] max-h-[800px] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Connect Trading Account</h2>
          
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Select Platform</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setSelectedPlatform('mt5');
                    setCurrentStep(2);
                  }}
                  className="p-6 border rounded-lg hover:border-purple-500 transition-all"
                >
                  <Image 
                    src={metatrader5Img} 
                    alt="MetaTrader 5"
                    width={64}
                    height={64}
                  />
                  <span className="block mt-2">MetaTrader 5</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Server
                </label>
                <input
                  type="text"
                  value={formData.server}
                  onChange={(e) => setFormData(prev => ({ ...prev, server: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {connectionStatus && (
                <div className={`p-4 rounded-lg ${
                  connectionStatus.connected ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`font-medium ${
                    connectionStatus.connected ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {connectionStatus.connected ? 'Connected Successfully' : 'Connection Failed'}
                  </p>
                  {connectionStatus.connected && connectionStatus.accountInfo && (
                    <div className="mt-2">
                      <p>Account Details:</p>
                      <ul className="mt-1 space-y-1">
                        <li>Balance: ${connectionStatus.accountInfo.balance}</li>
                        <li>Equity: ${connectionStatus.accountInfo.equity}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTradeModal; 