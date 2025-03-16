'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/db';
import { mt5Client } from '@/services/mt5/mt5Client';

// Constantes para localStorage
const STORAGE_PREFIX = 'smartalgo_';
const CURRENT_ACCOUNT_KEY = `${STORAGE_PREFIX}current_account`;
const LAST_ACTIVE_ACCOUNT_KEY = `${STORAGE_PREFIX}last_active_account`;

interface MT5Account {
  id: string;
  account_number: string;
  server: string;
  is_active: boolean;
  last_connected: string;
  platform_type: string;
  balance?: number;
}

export const ManageAccountsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('mt_connections')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (accountId: string) => {
    try {
      // Primero obtenemos la información de la cuenta que será activada
      const accountToActivate = accounts.find(account => account.id === accountId);
      if (!accountToActivate) {
        throw new Error('Account not found');
      }

      console.log('Activando cuenta:', accountToActivate.account_number, 'ID:', accountId);

      // VERIFICAR ACCESO A LA BD
      console.log('Verificando conexión a la base de datos...');
      const authCheck = supabase.auth.getSession();
      console.log('Estado de autenticación:', await authCheck);

      // VERIFICAR ID DE CUENTA ANTES DE MODIFICAR
      const { data: checkData, error: checkError } = await supabase
        .from('mt_connections')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (checkError) {
        console.error('Error al verificar la cuenta:', checkError);
        throw new Error(`No se pudo verificar la cuenta: ${checkError.message}`);
      }
      
      console.log('Cuenta encontrada en la base de datos:', checkData);

      // Desactivar todas las cuentas en la base de datos - más logging
      console.log('Desactivando todas las cuentas en la base de datos...');
      const deactivateResult = await supabase
        .from('mt_connections')
        .update({ is_active: false })
        .eq('user_id', session?.user?.id);
      
      console.log('Resultado de desactivación:', deactivateResult);
      if (deactivateResult.error) {
        console.error('Error al desactivar cuentas:', deactivateResult.error);
        throw deactivateResult.error;
      }
      console.log('Todas las cuentas desactivadas correctamente. Count:', deactivateResult.count);

      // Activar la cuenta seleccionada en la base de datos - FORZANDO actualización
      console.log('Activando cuenta seleccionada en la base de datos...');
      
      // Intento directo con ID específico
      const activateResult = await supabase
        .from('mt_connections')
        .update({ is_active: true, last_connection: new Date().toISOString() })
        .eq('id', accountId);
      
      console.log('Resultado de activación:', activateResult);
      if (activateResult.error) {
        console.error('Error al activar cuenta:', activateResult.error);
        throw activateResult.error;
      }
      
      if (activateResult.count === 0) {
        console.warn('La actualización no afectó a ninguna fila. Intentando método alternativo...');
        
        // Intento alternativo con account_number
        const altActivateResult = await supabase
          .from('mt_connections')
          .update({ is_active: true, last_connection: new Date().toISOString() })
          .eq('account_number', accountToActivate.account_number)
          .eq('user_id', session?.user?.id);
        
        console.log('Resultado de activación alternativa:', altActivateResult);
        if (altActivateResult.error) {
          console.error('Error en método alternativo:', altActivateResult.error);
        } else if (altActivateResult.count === 0) {
          console.error('Ambos métodos fallaron. No se pudo activar la cuenta.');
        } else {
          console.log('Cuenta activada correctamente usando método alternativo');
        }
      } else {
        console.log('Cuenta activada correctamente en la base de datos');
      }

      // Verificar que la cuenta se activó correctamente
      const { data: verifyData, error: verifyError } = await supabase
        .from('mt_connections')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (verifyError) {
        console.error('Error al verificar activación:', verifyError);
      } else {
        console.log('Estado final de la cuenta:', verifyData);
        if (!verifyData.is_active) {
          console.error('¡ADVERTENCIA! La cuenta no aparece como activa después de la actualización');
        }
      }

      // LIMPIEZA RADICAL DE LOCALSTORAGE
      console.log('Limpiando localStorage...');
      if (typeof window !== 'undefined') {
        // Borrar TODAS las entradas relacionadas con SmartAlgo
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        
        // Remover las claves en un bucle separado para evitar problemas con los índices
        console.log('Claves a eliminar:', keysToRemove);
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('Eliminada clave:', key);
        });
        
        // Establecer la nueva cuenta como activa en el localStorage global
        localStorage.setItem(CURRENT_ACCOUNT_KEY, accountToActivate.account_number);
        console.log('Nueva cuenta establecida como activa:', accountToActivate.account_number);
        
        // Forzar actualización de la última vez que cambiamos de cuenta
        localStorage.setItem(`${STORAGE_PREFIX}account_change_time`, new Date().getTime().toString());
        
        // Emitir evento para notificar a todos los componentes del cambio de cuenta
        console.log('Notificando cambio de cuenta a los componentes...');
        mt5Client.emit('accountChanged', {
          userId: session?.user?.id,
          accountNumber: accountToActivate.account_number
        });
      }

      // Actualizar la lista de cuentas
      await fetchAccounts();
      
      // Cerrar el modal
      onClose();
      
      // Opcionalmente, forzar una recarga de la página para garantizar un estado fresco
      if (confirm('¿Desea recargar la página para aplicar el cambio de cuenta?')) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating account:', err);
      setError('Failed to update account. Check console for details.');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Manage MT5 Accounts</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading accounts...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">No accounts found</div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div 
                  key={account.id}
                  className={`p-4 rounded-lg border ${account.is_active ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{account.account_number}</h3>
                      <p className="text-sm text-gray-500">{account.server}</p>
                      <p className="text-sm text-gray-500">
                        Last connected: {new Date(account.last_connected).toLocaleString()}
                      </p>
                      {account.balance && (
                        <p className="text-sm font-medium mt-1">
                          Balance: ${account.balance.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleSetActive(account.id)}
                        disabled={account.is_active}
                        className={`px-4 py-2 rounded-lg ${
                          account.is_active 
                            ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {account.is_active ? 'Active' : 'Set Active'}
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 