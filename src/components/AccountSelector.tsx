import React, { useState, useEffect, useRef } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import Link from 'next/link';

interface Account {
  account_number: string;
  mt5_login?: string;
  account_name?: string;
  balance?: number;
  equity?: number;
  is_active?: boolean;
}

interface AccountSelectorProps {
  accounts: Account[];
  currentAccount: string | null;
  onSelectAccount: (account: string) => void;
  className?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  currentAccount,
  onSelectAccount,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Cerrar el dropdown al hacer clic fuera
  useOnClickOutside<HTMLDivElement>(dropdownRef, () => setIsOpen(false));
  
  // También cerrar al presionar ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  // Encontrar la cuenta actual para mostrar detalles
  const currentAccountDetails = accounts.find(acc => acc.account_number === currentAccount) || null;
  
  if (accounts.length === 0) {
    return (
      <div className={`text-sm text-gray-500 p-2 border border-gray-300 rounded-lg ${className}`}>
        No hay cuentas disponibles
      </div>
    );
  }
  
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
         className="flex items-center h-[44px] w-[44px] sm:w-auto px-4 sm:px-8 space-x-0 sm:space-x-2 justify-center sm:justify-start text-sm bg-white border border-gray-200 rounded-full sm:rounded-lg hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
      >
        <svg
          className="w-4 h-4 text-[#6457a6]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span className="hidden sm:inline text-gray-700">All accounts</span>
        <svg
          className={`hidden sm:inline w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          {/* Fondo oscuro solo para móviles */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Contenido del dropdown */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-lg shadow-lg border border-gray-100 max-h-[80vh] overflow-y-auto sm:absolute sm:right-0 sm:bottom-auto sm:top-full sm:mt-1 sm:rounded-lg sm:w-64 sm:max-h-none sm:inset-x-auto">
            {/* All accounts section */}
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-600 mb-2">All accounts</div>
              <button
                onClick={() => {
                  onSelectAccount('all');
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <svg
                  className="w-4 h-4 mr-2 text-[#6457a6]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                All accounts
              </button>
            </div>
  
            {/* My accounts section */}
            <div className="px-3 py-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">My accounts</div>
              {accounts.map((account) => (
                <button
                  key={account.account_number}
                  onClick={() => {
                    onSelectAccount(account.account_number);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${account.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span>{account.account_name || account.mt5_login || account.account_number}</span>
                </button>
              ))}
            </div>
  
            {/* Manage accounts link */}
            <Link
              href="/settings/accounts"
              className="flex items-center px-5 py-2 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-100"
            >
              <svg
                className="w-4 h-4 mr-2 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Manage accounts
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountSelector; 