'use client';
import React from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import ZellaScoreRadar from '@/components/ZellaScoreRadar';
import DateRangeSelector from '@/components/DateRangeSelector';
import SimpleStatCard from '@/components/SimpleStatCard';
//import ProgressTracker from '@/components/ProgressTracker';
import ProgressTrackerNew from '@/components/ProgressTrackerNew';
import DailyTradeDetails from '@/components/DailyTradeDetails';
import DailyNetCumulativePL from '@/components/DailyNetCumulativePL';
import NetDailyPL from '@/components/NetDailyPL';
import RecentTradesSection from '@/components/RecentTradesSection';
import TradeTimePerformance from '@/components/TradeTimePerformance';
import TradingCalendar from '@/components/TradingCalendar';
import StatsOverview from '@/components/StatsOverview';
// Componente simple de tarjeta de estadística
function SimpleStatCard({ title, value, prefix = '', suffix = '' }: { title: string, value: number, prefix?: string, suffix?: string }) {
    return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <p className="text-xl font-bold">
        {prefix}{typeof value === 'number' ? value.toFixed(2) : value}{suffix}
      </p>
      </div>
    );
  }

export default function Dashboard() {
  const { loading, error, processedData, refreshData, dateRange, setDateRange } = useTradingData();

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <p>{error}</p>
          <button
            onClick={refreshData}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Reintentar
              </button>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-700">
          <p>No hay datos disponibles para mostrar.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <DateRangeSelector />
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Mostrando datos del {dateRange.startDate.toLocaleDateString()} al {dateRange.endDate.toLocaleDateString()}
      </div>

      {/* Estadísticas básicas */}
        {/* Agregar el componente de StatsOverview */}
      <StatsOverview />
      {/* ZellaScore y otros componentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ZellaScoreRadar />
        <div className="">
                <ProgressTrackerNew 
            handleDateRangeChange={(fromDate, toDate) => {
              // Actualizar el rango de fechas en el contexto
              setDateRange({
                startDate: fromDate,
                endDate: toDate,
                label: 'Personalizado'
              });
            }}
                />
              </div>
              <div className="">
                <DailyNetCumulativePL dailyResults={processedData.daily_results} />
              </div>
              <div className="">
                <NetDailyPL dailyResults={processedData.daily_results} />
              </div>
              <div className="">
                <RecentTradesSection />
              </div>
              <div className="">
                <TradeTimePerformance />
              </div>
             
            </div>
            <div className="flex flex-col gap-4 w-3/4 mt-4">
              <div className="w-full">
                <TradingCalendar />
              </div>
            </div>
    </div>
  );
} 
