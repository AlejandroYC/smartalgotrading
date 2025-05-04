'use client';

import React from 'react';
import TradingJournal from '@/components/TradingJournal';
import { useAuthContext } from '@/providers/AuthProvider';
import { useTradingData } from '@/contexts/TradingDataContext';
import FilterBar from '@/components/FilterBar';

export default function JournalPage() {
  const { session } = useAuthContext();
  const { currentAccount } = useTradingData();

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header con título y barra de filtros alineados */}
      <div className="bg-white px-6 py-3 flex justify-between items-center border-b shadow-md pt-6 pb-6 mb-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-black">Diario de Trading</h1>
        
        <FilterBar className="flex-shrink-0" />
      </div>
      
      <div className="px-6 pb-6 bg-white">
        <TradingJournal 
          userId={session?.user?.id || ''} 
          accountNumber={currentAccount || ''}
        />
      </div>
    </div>
  );
}