'use client';

import React from 'react';
import TradingJournal from '@/components/TradingJournal';
import { useAuthContext } from '@/providers/AuthProvider';
import { useTradingData } from '@/contexts/TradingDataContext';

export default function JournalPage() {
  const { session } = useAuthContext();
  const { currentAccount } = useTradingData();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Diario de Trading</h1>
      <TradingJournal 
        userId={session?.user?.id || ''} 
        accountNumber={currentAccount || ''}
      />
    </div>
  );
}