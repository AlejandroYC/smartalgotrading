import React, { useState, useEffect, useRef } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

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
  useOnClickOutside(dropdownRef, () => setIsOpen(false));
  
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
      <div className={`text-sm text-gray-500 p-2 border border-gray-300 rounded-md ${className}`}>
        No hay cuentas disponibles
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      >
        <div className="flex items-center">
          <div className="mr-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
          </div>
          <div>
            <div className="font-medium">
              {currentAccountDetails?.account_name || currentAccount || 'Seleccionar cuenta'}
            </div>
            {currentAccount && (
              <div className="text-xs text-gray-500">
                {currentAccountDetails?.mt5_login || currentAccount}
              </div>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 ml-2 -mr-1 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {accounts.map((account) => (
              <li
                key={account.account_number}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  account.account_number === currentAccount ? 'bg-primary/10 font-medium' : ''
                }`}
                onClick={() => {
                  onSelectAccount(account.account_number);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  <div className="mr-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  </div>
                  <div className="flex-1">
                    <div>{account.account_name || account.mt5_login || account.account_number}</div>
                    <div className="text-xs text-gray-500">{account.account_number}</div>
                  </div>
                  {(account.balance !== undefined || account.equity !== undefined) && (
                    <div className="text-right text-xs">
                      {account.balance !== undefined && (
                        <div>Balance: ${account.balance.toFixed(2)}</div>
                      )}
                      {account.equity !== undefined && (
                        <div>Equity: ${account.equity.toFixed(2)}</div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccountSelector; 