'use client';

import React from 'react';
import TradingJournal from '@/components/TradingJournal';
import { useAuthContext } from '@/providers/AuthProvider';
import { useTradingData } from '@/contexts/TradingDataContext';
import FilterBar from '@/components/FilterBar';

export default function JournalPage() {
  const { session, user } = useAuthContext();
  const { currentAccount } = useTradingData();
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = !!session?.user?.id;
  
  console.log('JournalPage - Auth status:', { 
    isAuthenticated, 
    userId: session?.user?.id,
    userObj: user
  });

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6]">
      {/* Header con título y barra de filtros alineados */}
      <div className="
  flex flex-row items-center justify-between flex-wrap
  pl-[16px] lg:pl-[30px] pr-[30px] pt-[16px] pb-[16px] bg-white
  shadow-sm shadow-[0_1px_3px_rgba(0,0,0,0.12)]
">
        <h1 className="text-xl font-semibold text-black">Diario de Trading</h1>
        
        <FilterBar className="flex-shrink-0" />
      </div>
      
      <div className="px-[16px] pb-6 bg-[#f3f4f6]">
        <TradingJournal 
          userId={session?.user?.id || ''} 
          accountNumber={currentAccount || ''}
        />
      </div>
    </div>
  );
}