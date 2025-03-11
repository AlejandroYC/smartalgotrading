'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/db';

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
      // Desactivar todas las cuentas
      await supabase
        .from('mt_connections')
        .update({ is_active: false })
        .eq('user_id', session?.user?.id);

      // Activar la cuenta seleccionada
      await supabase
        .from('mt_connections')
        .update({ is_active: true })
        .eq('id', accountId);

      await fetchAccounts();
    } catch (err) {
      console.error('Error updating account:', err);
      setError('Failed to update account');
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