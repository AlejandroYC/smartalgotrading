'use client';
import React from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import { useAuth } from '@/hooks/useAuth';
import ZellaScoreRadar from '@/components/ZellaScoreRadar';
import DateRangeSelector from '@/components/DateRangeSelector';
//import ProgressTracker from '@/components/ProgressTracker';
import ProgressTrackerNew from '@/components/ProgressTrackerNew';
import DailyTradeDetails from '@/components/DailyTradeDetails';
import DailyNetCumulativePL from '@/components/DailyNetCumulativePL';
import NetDailyPL from '@/components/NetDailyPL';
import RecentTradesSection from '@/components/RecentTradesSection';
import TradeTimePerformance from '@/components/TradeTimePerformance';
import TradingCalendar from '@/components/TradingCalendar';
import StatsOverview from '@/components/StatsOverview';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import DebugDataView from '@/components/DebugDataView';

// Agregar una bandera para controlar si se muestra la vista de depuración
const SHOW_DEBUG_VIEW = process.env.NODE_ENV === 'development';

// Componente de diagnóstico
function DiagnosticPanel() {
  const [diagnosticInfo, setDiagnosticInfo] = React.useState<any>({});
  const [testApiResult, setTestApiResult] = React.useState<string>('');
  const mt5ApiUrl = process.env.NEXT_PUBLIC_MT5_API_URL;
  
  const runDiagnostics = () => {
    // Verificar localStorage
    const connectionId = localStorage.getItem('connectionId');
    const accountNumber = localStorage.getItem('accountNumber');
    
    // Recopilar información
    setDiagnosticInfo({
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
      },
      environmentVars: {
        MT5_API_URL: mt5ApiUrl,
        NODE_ENV: process.env.NODE_ENV,
      },
      localStorage: {
        connectionId: connectionId,
        accountNumber: accountNumber,
        hasConnectionId: !!connectionId,
        hasAccountNumber: !!accountNumber
      }
    });
  };
  
  const testApiConnection = async () => {
    try {
      setTestApiResult('Probando conexión...');
      const response = await fetch(`${mt5ApiUrl}/queue-status`);
      const data = await response.json();
      setTestApiResult(`✅ Conexión exitosa: ${JSON.stringify(data)}`);
    } catch (error) {
      setTestApiResult(`❌ Error de conexión: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

    return (
    <div className="bg-white p-4 rounded-lg shadow mt-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Panel de Diagnóstico</h3>
      
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={runDiagnostics}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Diagnosticar
              </button>
        
        <button 
          onClick={testApiConnection}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Probar API
        </button>
        
        <button 
          onClick={() => {
            localStorage.setItem('connectionId', "1137a351-cbf1-4730-a03a-ab80cff3d6c1");
            localStorage.setItem('accountNumber', "19166543");
            runDiagnostics();
          }}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Reparar Connection ID
        </button>
              </div>
              
      {testApiResult && (
        <div className={`p-2 rounded mb-4 text-sm ${testApiResult.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {testApiResult}
        </div>
      )}
      
      {Object.keys(diagnosticInfo).length > 0 && (
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
          {JSON.stringify(diagnosticInfo, null, 2)}
        </pre>
      )}
      </div>
    );
  }

export default function Dashboard() {
  const { user } = useAuth();
  const { loading, error, processedData, refreshData, dateRange, setDateRange } = useTradingData();
  const { status, manualUpdate } = useAutoUpdate(user?.id);

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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-3">
          {/* Indicador de actualización */}
          {status.isUpdating && (
            <div className="text-sm text-gray-600 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Actualizando...
            </div>
          )}
          
          {/* Contador de actualizaciones */}
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <span className="font-medium text-indigo-600">
              {status.updateCount} actualizaciones
          </span>
        </div>
          
          {/* Botón de actualización manual */}
          <button 
            onClick={() => manualUpdate()}
            disabled={status.isUpdating}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            Actualizar datos
          </button>
          
          <DateRangeSelector />
        </div>
      </div>

      {status.error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          Error: {status.error}
        </div>
      )}
      
      {status.lastUpdate && (
        <div className="text-xs text-gray-500 mb-4">
          Última actualización: {status.lastUpdate.toLocaleString()}
        </div>
      )}

      <div className="text-sm text-gray-500 mb-4">
        Mostrando datos del {dateRange.startDate.toLocaleDateString()} al {dateRange.endDate.toLocaleDateString()}
      </div>
      
      {/* Panel de diagnóstico */}
      <DiagnosticPanel />

      {/* Estadísticas básicas */}
        {/* Agregar el componente de StatsOverview */}
      <StatsOverview />
      {SHOW_DEBUG_VIEW && <DebugDataView />}
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
