'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/providers/AuthProvider';
import { supabase } from '@/lib/db';
import { useMTConnections } from '@/hooks/useMTConnections';
import { toast } from 'react-hot-toast';
import { MT5Client } from '@/services/mt5/mt5Client';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { LocalStorageService } from '@/services/LocalStorageService';

interface Account {
  id: string;
  name: string;
  isActive?: boolean;
  connection_id?: string;
  login?: string;
  server?: string;
  password?: string;
}

interface DailyJournalProps {
  selectedCurrency?: string;
  onAccountChange?: (account: Account) => void;
  refreshData?: (fromDate?: string, toDate?: string) => Promise<void>;
  loading?: boolean;
  parentIsLoading?: boolean;
  error?: string;
  selectedAccount?: Account | null;
}

export const DailyJournal: React.FC<DailyJournalProps> = ({
  selectedCurrency = '$',
  onAccountChange,
  refreshData,
  loading,
  parentIsLoading,
  error,
  selectedAccount
}: DailyJournalProps) => {
  const { user, session } = useAuthContext();  // Añadido user para usar con localStorage
  const { connections } = useMTConnections();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [accountData, setAccountData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');
  const menuRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return [start, end];
  });
  const [startDate, endDate] = dateRange;

  // Inicializar datos desde localStorage
  useEffect(() => {
    if (user?.id && selectedAccount) {
      try {
        // Obtener datos del localStorage en lugar de esperar actualizaciones del WebSocket
        const storedAccount = LocalStorageService.getLastActiveAccount(user.id);
        if (storedAccount) {
          setAccountData({
            balance: storedAccount.accountInfo?.balance || 0,
            equity: storedAccount.accountInfo?.equity || 0,
            floating_pl: storedAccount.accountInfo?.floating_pl || 0,
            positions: storedAccount.positions || []
          });
          
          // Actualizar timestamp de última actualización
          if (storedAccount.lastUpdated) {
            const updateTime = new Date(storedAccount.lastUpdated);
            setLastUpdate(updateTime.toLocaleTimeString());
          }
        }
      } catch (error) {
        console.error("Error cargando datos desde localStorage:", error);
      }
    }
  }, [user?.id, selectedAccount]);

  // ... existing code for closing menu ...

  // Inicializar con últimos 30 días y hacer la primera carga
  useEffect(() => {
    if (startDate && endDate) {
      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      refreshData?.(fromDate, toDate);
    }
  }, []); // Solo al montar el componente

  // Manejar cambios de cuenta
  const handleAccountChange = async (account: Account) => {
    try {
      setIsLoadingLocal(true);
      
      // Si estamos usando localStorage, actualizar la cuenta activa
      if (user?.id) {
        try {
          // Obtener todas las cuentas
          const accounts = LocalStorageService.getUserAccounts(user.id);
          
          // Buscar la cuenta seleccionada
          const accountKey = Object.keys(accounts).find(key => 
            accounts[key].accountNumber === account.login
          );
          
          if (accountKey) {
            // Establecer como cuenta activa
            LocalStorageService.setLastActiveAccount(user.id, accountKey);
            
            // Obtener datos de la cuenta
            const activeAccount = LocalStorageService.getLastActiveAccount(user.id);
            if (activeAccount) {
              setAccountData({
                balance: activeAccount.accountInfo?.balance || 0,
                equity: activeAccount.accountInfo?.equity || 0,
                floating_pl: activeAccount.accountInfo?.floating_pl || 0,
                positions: activeAccount.positions || []
              });
            }
            
            // Notificar cambio
            onAccountChange?.(account);
            setIsAccountMenuOpen(false);
            toast.success('Account switched successfully');
          } else {
            throw new Error('Account not found in localStorage');
          }
        } catch (storageError) {
          console.error("Error switching account in localStorage:", storageError);
          
          // Fallback al comportamiento original
          const mt5Client = MT5Client.getInstance();
          
          if (!account.connection_id || !account.login || !account.password || !account.server) {
            throw new Error('Missing account credentials');
          }

          await mt5Client.connectAccount(
            session?.user?.id || '',
            {
              accountNumber: account.login,
              password: account.password,
              server: account.server
            }
          );

          onAccountChange?.(account);
          setIsAccountMenuOpen(false);
          toast.success('Account switched successfully');
        }
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Error switching account:', error);
      toast.error('Failed to switch account');
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Manejar cambios de fecha
  const handleDateChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
    if (update[0] && update[1]) {
      const fromDate = update[0].toISOString().split('T')[0];
      const toDate = update[1].toISOString().split('T')[0];
      refreshData?.(fromDate, toDate);
    }
  };

  // Refrescar datos
  const handleRefresh = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    
    setIsLoadingLocal(true);
    try {
      const fromDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
      const toDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;
      
      // Si usamos localStorage, recargar datos
      const storedAccount = LocalStorageService.getLastActiveAccount(user.id);
      if (storedAccount) {
        setAccountData({
          balance: storedAccount.accountInfo?.balance || 0,
          equity: storedAccount.accountInfo?.equity || 0,
          floating_pl: storedAccount.accountInfo?.floating_pl || 0,
          positions: storedAccount.positions || []
        });
        
        // Actualizar timestamp
        setLastUpdate(new Date().toLocaleTimeString());
      }
      
      // Llamar a refreshData del padre si existe
      if (refreshData) {
        await refreshData(fromDateStr, toDateStr);
      }
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Estados de carga y error
  if (loading) {
    return <div className="p-4">Loading accounts...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading accounts: {error}</div>;
  }

  // Renderizar componente
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Daily Journal</h2>
          <p className="text-sm text-gray-500">
            {isLoadingLocal ? 
              'Loading account data...' : 
              `Last update: ${lastUpdate}`
            }
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Menú desplegable de cuentas */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              disabled={isLoadingLocal || parentIsLoading}
            >
              {isLoadingLocal ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>{selectedAccount?.name || 'All Accounts'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {/* Menú desplegable */}
            {isAccountMenuOpen && !isLoadingLocal && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  {/* Mostrar cuentas desde localStorage si está disponible */}
                  {user?.id && (() => {
                    try {
                      const accounts = LocalStorageService.getUserAccounts(user.id);
                      if (Object.keys(accounts).length > 0) {
                        return Object.entries(accounts).map(([key, data]) => {
                          const account: Account = {
                            id: key,
                            name: `Account ${data.accountNumber || 'undefined'}`,
                            login: data.accountNumber
                          };
                          
                          return (
                            <button
                              key={key}
                              onClick={() => handleAccountChange(account)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <input
                                type="checkbox"
                                checked={selectedAccount?.login === account.login}
                                readOnly
                                className="mr-3 h-4 w-4 text-purple-600 rounded border-gray-300"
                              />
                              <span>{account.name}</span>
                            </button>
                          );
                        });
                      }
                    } catch (error) {
                      console.error("Error loading accounts from localStorage:", error);
                    }
                    return null;
                  })() || connections.map(connection => {
                    const account: Account = {
                      id: connection.id,
                      name: `MT5 ${connection.account_number || 'undefined'}`,
                      connection_id: connection.connection_id,
                      login: connection.account_number,
                      server: connection.server,
                      password: connection.password
                    };
                    
                    return (
                      <button
                        key={connection.id}
                        onClick={() => handleAccountChange(account)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccount?.id === connection.id}
                          readOnly
                          className="mr-3 h-4 w-4 text-purple-600 rounded border-gray-300"
                        />
                        <span>{account.name}</span>
                      </button>
                    );
                  })}
                  
                  <div className="border-t my-2"></div>
                  
                  <Link
                    href="/dashboard/manage-accounts"
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="mr-3 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage Accounts
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Selector de fecha */}
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600"
            placeholderText="Select date range"
            isClearable={false}
            maxDate={new Date()}
            dateFormat="MM/dd/yyyy"
          />

          {/* Botón de Refresh */}
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Data</span>
          </button>

          {/* Botón Start my day */}
          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Start my day
          </button>
        </div>
      </div>

      {/* Mostrar datos de la cuenta con protección contra valores undefined */}
      {accountData && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Balance</h3>
            <p className="text-2xl font-semibold">${(accountData.balance || 0).toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Equity</h3>
            <p className="text-2xl font-semibold">${(accountData.equity || 0).toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Floating P/L</h3>
            <p className={`text-2xl font-semibold ${(accountData.floating_pl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(accountData.floating_pl || 0).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Open Positions</h3>
            <p className="text-2xl font-semibold">{accountData.positions?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 