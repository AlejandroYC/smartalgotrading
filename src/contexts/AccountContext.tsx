'use client';

import React, { createContext, useContext, useState } from 'react';

interface Account {
  account_number: string;
  mt5_login?: string;
  account_name?: string;
  balance?: number;
  equity?: number;
  is_active?: boolean;
}

interface AccountContextType {
  accounts: Account[];
  currentAccount: string | null;
  setCurrentAccount: (account: string) => void;
  setAccounts: (accounts: Account[]) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        currentAccount,
        setCurrentAccount,
        setAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccountContext must be used within an AccountProvider');
  }
  return context;
} 