"use client";
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from "react";
import { useTradingData } from '@/contexts/TradingDataContext';
import StatsOverview from "@/components/StatsOverview";
import RecentTradesSection from "@/components/RecentTradesSection";
import DateRangeSelector from "@/components/DateRangeSelector";
import AccountSelector from "@/components/AccountSelector";
import { useAccountContext } from "@/contexts/AccountContext";
import { HangTightLoading } from "@/components/HangTightLoading";

// Datos de ejemplo para las cuentas
const sampleAccounts = [
  {
    account_number: "12345",
    mt5_login: "12345",
    account_name: "Demo Account 1",
    balance: 10000,
    equity: 10500,
    is_active: true
  },
  {
    account_number: "67890",
    mt5_login: "67890",
    account_name: "Demo Account 2",
    balance: 5000,
    equity: 4800,
    is_active: true
  }
];

export default function TradesPage() {
  const { processedData, loading: apiLoading, error } = useTradingData();
  const { accounts, currentAccount, setCurrentAccount, setAccounts } = useAccountContext();
  const [pageLoading, setPageLoading] = useState(true);

  // Cargar cuentas de ejemplo al montar el componente
  useEffect(() => {
    if (accounts.length === 0) {
      setAccounts(sampleAccounts);
      setCurrentAccount(sampleAccounts[0].account_number);
    }
    
    // Simular tiempo de carga inicial para asegurar que el loading se muestre
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [accounts.length, setAccounts, setCurrentAccount]);

  // Determinar si algo está cargando
  const isLoading = pageLoading || apiLoading;

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-100 relative">
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-white/80">
          <HangTightLoading
            message="Cargando trades"
            description="Obteniendo datos de transacciones"
            fullScreen={false}
          />
        </div>
      )}
      
      {/*  - Siempre visible */}
      <div className="flex-none flex justify-between items-center p-4 bg-white border-b z-30">
        <h1 className="text-2xl font-semibold text-gray-800">Trade Log</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75M3 18h9.75M16.5 9v9m0 0l3-3m-3 3l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Filters
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <Suspense fallback={<div className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Loading...</div>}>
              <DateRangeSelector />
            </Suspense>
          </div>
          {accounts && accounts.length > 0 && (
            <AccountSelector
              accounts={accounts}
              currentAccount={currentAccount}
              onSelectAccount={(account) => {
                setCurrentAccount(account);
                // Mostrar loading al cambiar de cuenta
                setPageLoading(true);
                setTimeout(() => setPageLoading(false), 800);
              }}
            />
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-[16px] ">
        {error && !isLoading && (
          <div className="m-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="h-full flex flex-col">
            {/* Stats Overview */}
            <div className="flex-none p-[16px] mt-8">
              <StatsOverview />
            </div>

            {/* Trade History */}
            <div className="flex-1 px-[16px] overflow-auto">
              <RecentTradesSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Datos de ejemplo
const areaData = [
  { name: "Jan", uv: 30 },
  { name: "Feb", uv: 60 },
  { name: "Mar", uv: 45 },
  { name: "Apr", uv: 80 },
  { name: "May", uv: 70 },
  { name: "Jun", uv: 110 },
];

const profitFactorData = [{ name: "Profit", value: 3.04, fill: "#10B981" }];

const tradeWinData = [
  { name: "Win", value: 60.62, fill: "#10B981" },
  { name: "Rest", value: 39.38, fill: "#E5E7EB" },
];