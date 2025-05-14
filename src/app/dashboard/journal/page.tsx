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
    <div className="flex flex-col h-screen bg-white">
      {/* Header con título y barra de filtros alineados */}
      <div className="bg-white px-6 py-3 flex justify-between items-center border-b shadow-md pt-6 pb-6 mb-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-black">Diario de Trading</h1>
        
        <FilterBar className="flex-shrink-0" />
      </div>
      
      <div className="px-6 pb-6 bg-white">
        {isAuthenticated ? (
          <TradingJournal 
            userId={session.user.id} 
            accountNumber={currentAccount || ''}
          />
        ) : (
          <div className="p-8 text-center">
            <div className="mb-4 text-red-600 text-lg font-semibold">
              Sesión no disponible
            </div>
            <p className="text-gray-600">
              Para usar el diario de trading, debes iniciar sesión nuevamente.
              <br />
              Si el problema persiste, intenta cerrar sesión y volver a iniciar sesión.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}