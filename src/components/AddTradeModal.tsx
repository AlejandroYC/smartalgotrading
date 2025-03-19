'use client';
import React, { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import metatrader4Img from '../images/metatrader4.png';
import metatrader5Img from '../images/metatrader5.png';
import { MT5Client } from '@/services/mt5/mt5Client';
import { useAuthContext } from '@/providers/AuthProvider';
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
  const serveroption = [
    {
      label: 'Weltrade-Real',
      value: 'Weltrade-Real'
    },
    {
      label: 'Weltrade-Demo',
      value: 'Weltrade-Demo'
    }
  ]
  const { user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<'mt4' | 'mt5' | null>(null);
  const [formData, setFormData] = useState<MTConnectionForm>({
    server: serveroption[0].value,
    account_number: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    accountInfo?: any;
  } | null>(null);

  // Asegurar que el servidor siempre tenga un valor seleccionado
  useEffect(() => {
    if (currentStep === 2 && !formData.server) {
      setFormData(prev => ({
        ...prev,
        server: serveroption[0].value
      }));
    }
  }, [currentStep]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    
    if (!formData.server || !formData.account_number || !formData.password) {
      setError('Todos los campos son obligatorios. Por favor, complete el formulario.');
      toast.error('Todos los campos son obligatorios');
      return;
    }

 
    
    setError(null);
    setIsSubmitting(true);

    const toastId = 'mt5-connection';
    try {
      // Depurando información del usuario
 
      
      if (!user?.id) {
        console.error("Error: user.id no está disponible. user:", user);
        throw new Error('User not authenticated');
      }
      
    

      // Limpiar todo el localStorage relacionado con nuestro proyecto
   
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('smartalgo_') || 
          key.includes('connection') || 
          key.includes('account') ||
          key.includes('trades') ||
          key.includes('positions')
        )) {
       
          localStorage.removeItem(key);
          i--; // Ajustar el índice ya que eliminamos un elemento
        }
      }


      const mt5Client = MT5Client.getInstance();

      toast.loading('Connecting to MT5...', { id: toastId });

      // Asegurarnos de que los campos coincidan exactamente con lo que espera la interfaz MT5ConnectionParams
      const connectionResult = await mt5Client.connectAccount(user.id, {
        accountNumber: formData.account_number.trim(),  // Asegurarnos de que no haya espacios
        password: formData.password,
        server: formData.server.trim()  // Asegurarnos de que no haya espacios
      });

     

      // La respuesta de connectAccount ya está normalizada a MT5FullAccountData
      if (connectionResult) {
     
        
        // Preparar los datos para almacenamiento
        const accountData = {
          connectionId: connectionResult.connection_id,
          accountInfo: {
            login: connectionResult.login,
            name: connectionResult.name || '',
            server: connectionResult.server,
            balance: connectionResult.balance,
            equity: connectionResult.equity,
            margin: connectionResult.margin,
            margin_free: connectionResult.margin_free || 0,
            floating_pl: connectionResult.floating_pl
          },
          positions: connectionResult.positions || [],
          history: connectionResult.deals || [],
          statistics: connectionResult.statistics || {},
          platformType: selectedPlatform || "mt5",
          accountNumber: formData.account_number,
          server: formData.server,
          lastUpdated: new Date().toISOString()
        };
        

        
        if (user.id) {
          const accountId = accountData.connectionId;
          
          const key = `smartalgo_${user.id}_user_accounts`;
          let accounts: Record<string, any> = {};
          
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
          onAccountConnected({
            ...connectionResult,
            account_number: formData.account_number,
            server: formData.server,
            platform_type: "MT5"
          });
        }

        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error("Invalid response from server");
      }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-black">
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
          <h2 className="text-2xl font-bold mb-6">Conectar cuenta</h2>
          
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Seleccionar plataforma</h3>
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
                <select
                  value={formData.server}
                  onChange={(e) => setFormData(prev => ({ ...prev, server: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                >
                  {serveroption.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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