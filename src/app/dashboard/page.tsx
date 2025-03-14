'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
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
import AccountSelector from '@/components/AccountSelector';

// Agregar una bandera para controlar si se muestra la vista de depuración
const SHOW_DEBUG_VIEW = process.env.NODE_ENV === 'development';

// Componente de diagnóstico mejorado
function DiagnosticPanel() {
  const { 
    processedData, 
    rawData, 
    currentAccount,
    userAccounts,
    loadUserAccounts,
    refreshData
  } = useTradingData();
  
  const [diagnosticInfo, setDiagnosticInfo] = React.useState<any>({});
  const [testApiResult, setTestApiResult] = React.useState<string>('');
  const [storageContents, setStorageContents] = React.useState<any>(null);
  const [apiUrl, setApiUrl] = React.useState<string>('');
  const mt5ApiUrl = process.env.NEXT_PUBLIC_MT5_API_URL;
  
  React.useEffect(() => {
    // Inicializar el estado con la URL actual
    setApiUrl(mt5ApiUrl || 'https://18.225.209.243.nip.io');
  }, [mt5ApiUrl]);
  
  const runDiagnostics = () => {
    // Verificar localStorage
    const storageKeys: Array<{key: string, value: string | null}> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('smartalgo_')) {
        storageKeys.push({
          key,
          value: key.includes('account_data') 
            ? 'Datos de cuenta (muy extensos para mostrar)'
            : localStorage.getItem(key)
        });
      }
    }
    
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
      contextInfo: {
        hasProcessedData: !!processedData,
        hasRawData: !!rawData,
        currentAccount,
        userAccountsCount: userAccounts.length,
      },
      localStorage: storageKeys
    });
  };
  
  const checkAccountData = () => {
    const accountKey = currentAccount ? `smartalgo_${currentAccount}_account_data` : null;
    if (!accountKey) {
      setStorageContents({ error: "No hay cuenta seleccionada" });
      return;
    }
    
    const data = localStorage.getItem(accountKey);
    if (!data) {
      setStorageContents({ error: `No hay datos para la clave ${accountKey}` });
      return;
    }
    
    try {
      const parsed = JSON.parse(data);
      setStorageContents({
        accountNumber: currentAccount,
        dataSize: data.length,
        hasHistory: !!parsed.history,
        historyCount: parsed.history?.length || 0,
        hasStatistics: !!parsed.statistics,
        hasPositions: !!parsed.positions,
        positionsCount: parsed.positions?.length || 0,
        rawSample: JSON.stringify(parsed).substring(0, 100) + '...' // Mostrar los primeros 100 caracteres
      });
    } catch (e: unknown) {
      setStorageContents({ error: `Error parseando JSON: ${e instanceof Error ? e.message : String(e)}` });
    }
  };
  
  const testApiConnection = async () => {
    const urlToTest = apiUrl || mt5ApiUrl || 'https://18.225.209.243.nip.io';
    try {
      setTestApiResult('Probando conexión...');
      const response = await fetch(`${urlToTest}/queue-status`);
      const data = await response.json();
      setTestApiResult(`✅ Conexión exitosa: ${JSON.stringify(data)}`);
    } catch (error) {
      setTestApiResult(`❌ Error de conexión: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const updateApiUrl = () => {
    try {
      if (!apiUrl) {
        alert('La URL no puede estar vacía');
        return;
      }
      
      // Verificar si es una URL válida
      new URL(apiUrl);
      
      // Guardar en localStorage para uso en refreshes
      localStorage.setItem('smartalgo_api_url_override', apiUrl);
      
      alert(`URL de la API actualizada a: ${apiUrl}\nPor favor, recarga la página para aplicar los cambios.`);
    } catch (e) {
      alert(`URL inválida: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const inspectLocalStorage = () => {
    const diagnosticInfo: {
      activeKeys: Array<{key: string, value: string | null}>,
      dataKeys: Array<{
        key: string, 
        size?: number, 
        hasHistory?: boolean, 
        historyItems?: number, 
        hasStatistics?: boolean, 
        lastUpdated?: string,
        error?: string
      }>,
      otherKeys: Array<{key: string, value: string | null}>
    } = {
      activeKeys: [],
      dataKeys: [],
      otherKeys: []
    };
    
    // Recorrer todas las claves en localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      if (key.startsWith('smartalgo_')) {
        // Separar por categorías
        if (key.includes('_account_data')) {
          // Intentar extraer contenido básico
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const hasHistory = !!data.history;
            const hasStatistics = !!data.statistics;
            
            diagnosticInfo.dataKeys.push({
              key,
              size: localStorage.getItem(key)?.length || 0,
              hasHistory,
              historyItems: hasHistory ? data.history.length : 0,
              hasStatistics,
              lastUpdated: data.lastUpdated || 'desconocido'
            });
          } catch (e) {
            diagnosticInfo.dataKeys.push({
              key,
              error: `Error al parsear JSON: ${e instanceof Error ? e.message : String(e)}`
            });
          }
        } 
        else if (key.includes('current_account') || key.includes('last_active')) {
          diagnosticInfo.activeKeys.push({
            key,
            value: localStorage.getItem(key)
          });
        }
        else {
          diagnosticInfo.otherKeys.push({
            key,
            value: localStorage.getItem(key)
          });
        }
      }
    }
    
    // Verificar consistencia entre las claves de cuenta activa
    const currentAccount = localStorage.getItem('smartalgo_current_account');
    if (currentAccount) {
      const storageKey = `smartalgo_${currentAccount}_account_data`;
      const hasData = !!localStorage.getItem(storageKey);
      
      // Mostrar alerta si no hay consistencia
      if (!hasData) {
        alert(`⚠️ PROBLEMA DETECTADO: La cuenta activa ${currentAccount} no tiene datos en localStorage.`);
      }
    }
    
    // Actualizar el panel con la información
    setDiagnosticInfo({
      ...diagnosticInfo,
      localStorage: diagnosticInfo
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Panel de Diagnóstico</h3>
      
      {/* Información de conexión a la API */}
      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
        <h4 className="text-md font-semibold mb-2">Configuración de API</h4>
        
        <div className="mb-2">
          <p className="text-sm text-gray-700">URL actual: <code className="bg-gray-100 px-1 rounded">{mt5ApiUrl || 'No configurada'}</code></p>
        </div>
        
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="Ej: https://18.225.209.243.nip.io"
            className="text-sm border border-gray-300 rounded px-2 py-1 flex-grow"
          />
          <button
            onClick={updateApiUrl}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Actualizar URL
          </button>
        </div>
        
        <div className="text-xs text-gray-600">
          <p>Nota: Cambiar la URL puede causar problemas de conexión si no es correcta.</p>
          <p>La URL debe tener el formato completo, incluyendo https://</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button 
          onClick={runDiagnostics}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Diagnosticar
        </button>
        
        <button 
          onClick={checkAccountData}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Verificar Datos de Cuenta
        </button>
        
        <button 
          onClick={testApiConnection}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Probar API
        </button>
        
        <button 
          onClick={() => {
            loadUserAccounts().then(() => {
              refreshData();
              runDiagnostics();
            });
          }}
          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Recargar Cuentas y Datos
        </button>
        
        <button 
          onClick={() => {
            localStorage.setItem('smartalgo_current_account', currentAccount || "34061170");
            runDiagnostics();
          }}
          className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Configurar cuenta actual
        </button>
        
        <button 
          onClick={() => {
            localStorage.removeItem('smartalgo_last_refresh_time');
            localStorage.removeItem('smartalgo_last_update_time');
            runDiagnostics();
          }}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Forzar actualización
        </button>
        
        <button 
          onClick={inspectLocalStorage}
          className="px-3 py-1 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700"
        >
          Diagnosticar localStorage
        </button>
        
        <button 
          onClick={() => {
            // Normalizar datos entre cuenta activa y datos almacenados
            const currentAccount = localStorage.getItem('smartalgo_current_account');
            if (currentAccount) {
              // Verificar todas las claves para encontrar datos relevantes
              let foundData = null;
              const targetKey = `smartalgo_${currentAccount}_account_data`;
              
              // Buscar primero en la clave estandarizada
              foundData = localStorage.getItem(targetKey);
              
              // Si no encontramos, buscar otras claves que contengan el número de cuenta
              if (!foundData) {
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key !== targetKey && key.includes(currentAccount)) {
                    foundData = localStorage.getItem(key);
                    if (foundData) {
                      break;
                    }
                  }
                }
              }
              
              // Si encontramos datos, guardarlos en la clave estandarizada
              if (foundData) {
                localStorage.setItem(targetKey, foundData);
                alert(`✅ Datos normalizados correctamente para cuenta ${currentAccount}.`);
                
                // Actualizar panel de diagnóstico
                setTimeout(inspectLocalStorage, 500);
                
                // Refrescar datos en la UI
                refreshData();
              } else {
                alert(`⚠️ No se encontraron datos para la cuenta ${currentAccount}.`);
              }
            } else {
              alert('⚠️ No hay cuenta seleccionada.');
            }
          }}
          className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600"
        >
          Normalizar localStorage
        </button>
        
        <button 
          onClick={() => {
            // Preguntar al usuario para confirmar
            if (confirm('⚠️ Esto eliminará TODOS los datos guardados. ¿Estás seguro?')) {
          
              
              // Guardar la cuenta actual antes de limpiar todo
              const currentAccount = localStorage.getItem('smartalgo_current_account');
              
              // Eliminar todo lo que tenga el prefijo smartalgo_
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('smartalgo_')) {
               
                  localStorage.removeItem(key);
                }
              });
              
              // Si teníamos una cuenta, restaurar esa preferencia
              if (currentAccount) {
                localStorage.setItem('smartalgo_current_account', currentAccount);
              }
              
              alert('✅ LocalStorage limpiado correctamente. La página se recargará para aplicar los cambios.');
              
              // Recargar la página después de limpiar
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Limpiar Todo y Recargar
        </button>
      </div>
      
      {testApiResult && (
        <div className={`p-2 rounded mb-4 text-sm ${testApiResult.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {testApiResult}
        </div>
      )}
      
      {storageContents && (
        <div className="p-2 rounded mb-4 bg-yellow-50 border border-yellow-200 text-sm">
          <h4 className="font-semibold mb-1">Datos de cuenta en localStorage</h4>
          {storageContents.error ? (
            <p className="text-red-600">{storageContents.error}</p>
          ) : (
            <div>
              <p><strong>Cuenta:</strong> {storageContents.accountNumber}</p>
              <p><strong>Tamaño de datos:</strong> {storageContents.dataSize} bytes</p>
              <p><strong>Historial:</strong> {storageContents.hasHistory ? `✅ (${storageContents.historyCount} items)` : '❌'}</p>
              <p><strong>Estadísticas:</strong> {storageContents.hasStatistics ? '✅' : '❌'}</p>
              <p><strong>Posiciones:</strong> {storageContents.hasPositions ? `✅ (${storageContents.positionsCount} items)` : '❌'}</p>
              <p className="mt-2 text-xs overflow-auto whitespace-nowrap">
                <strong>Muestra:</strong> <code>{storageContents.rawSample}</code>
              </p>
            </div>
          )}
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

// Agregar un componente para mostrar el estado de carga durante el cambio de cuenta
const AccountChangeIndicator = ({ isChanging, account }: { isChanging: boolean, account: string | null }) => {
  if (!isChanging) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-primary/80 text-white py-2 px-4 flex justify-center items-center z-50">
      <div className="animate-pulse mr-2">
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <span>Cargando datos para cuenta {account}...</span>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    loading, 
    error, 
    processedData, 
    refreshData, 
    dateRange, 
    setDateRange,
    userAccounts,
    currentAccount,
    selectAccount,
    loadUserAccounts
  } = useTradingData();
  
  // Refs para controlar inicialización y renderizado
  const initialized = useRef(false);
  const hasRendered = useRef(false);
  
  // Llamar al hook directamente en el nivel superior del componente
  // siguiendo las reglas de Hooks de React
  const { status, manualUpdate, toggleAutoUpdate } = useAutoUpdate(user?.id);
  
  // Dentro del componente Dashboard, agregar estado para el cambio de cuenta
  const [isChangingAccount, setIsChangingAccount] = useState(false);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState<string | null>(null);
  
  // Simplificar la función handleAccountSelect para usar la nueva implementación
  const handleAccountSelect = async (account: string) => {
    if (!account || account === selectedAccountNumber) return;
    
    setIsChangingAccount(true);
    setSelectedAccountNumber(account);
    
    try {
    
      
      // Usar directamente la función selectAccount mejorada
      await selectAccount(account);

    } catch (error) {
  
      
      // Informar al usuario sobre el error
      alert(`Error al cambiar de cuenta: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Usar un pequeño delay para evitar parpadeos si el cambio es muy rápido
      setTimeout(() => {
        setIsChangingAccount(false);
      }, 500);
    }
  };
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!user?.id || initialized.current) return;
    
    const initializeDashboard = async () => {
      initialized.current = true;
      
      try {
  
        
        // Primero cargar las cuentas del usuario
        await loadUserAccounts();
        
        // Si no hay datos procesados, intentar cargarlos
        if (!processedData && currentAccount) {
         
          
          // Intentar actualizar manualmente con un breve retraso para evitar loops
          setTimeout(() => {
            manualUpdate();
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
        // No resetear initialized.current en caso de error para evitar múltiples intentos
      }
    };

    initializeDashboard();
  }, [user?.id, loadUserAccounts, manualUpdate]); // Dependencias mínimas necesarias

  // Log para depuración con más detalles, usando un contador de renderizados
  useEffect(() => {
    // Solo ejecutar el log una vez por renderizado
    if (hasRendered.current) return;
    hasRendered.current = true;
    
    const storageKey = currentAccount ? `smartalgo_${currentAccount}_account_data` : null;
    const hasStoredData = storageKey ? !!localStorage.getItem(storageKey) : false;
    

    
    // Permitir futuros logs en cambios significativos
    const resetRenderFlag = setTimeout(() => {
      hasRendered.current = false;
    }, 1000);
    
    return () => clearTimeout(resetRenderFlag);
  }, [user?.id, currentAccount, processedData, userAccounts.length]);

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <h3 className="font-semibold text-lg mb-2">Error</h3>
          <p>{error}</p>
          
          {/* Mostrar mensajes adicionales según el tipo de error */}
          {error.includes('Method Not Allowed') && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <p>
                <strong>Información técnica:</strong> El servidor espera un método HTTP diferente. 
                Este es un problema de configuración que debe ser resuelto por el administrador del sistema.
              </p>
              <p className="mt-1">
                Por favor, intenta la opción "Limpiar datos y forzar actualización" en el panel de diagnóstico 
                o contacta al soporte técnico si el problema persiste.
              </p>
            </div>
          )}

          {error.includes('no existe en el servidor') && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <p>
                <strong>Sugerencia:</strong> La cuenta seleccionada no está registrada correctamente en el servidor.
              </p>
              <p className="mt-1">
                Verifica que la cuenta esté correctamente configurada en el sistema o selecciona otra cuenta disponible.
              </p>
            </div>
          )}
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
            >
              Reintentar
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('smartalgo_last_refresh_time');
                localStorage.removeItem('smartalgo_last_update_time');
                window.location.reload();
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-700">
          <p>No hay datos disponibles para mostrar.</p>
          <div className="mt-4">
            <button
              onClick={manualUpdate}
              className="px-3 py-1 mr-2 bg-blue-500 text-white rounded text-sm"
            >
              Actualizar datos
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('smartalgo_last_refresh_time');
                window.location.reload();
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-3">
          {/* Selector de cuentas */}
          {userAccounts.length > 0 && (
            <div className="mb-4">
              <AccountSelector 
                accounts={userAccounts} 
                currentAccount={currentAccount}
                onSelectAccount={handleAccountSelect} 
                className="w-full max-w-xs"
              />
            </div>
          )}

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
          
          {/* Contador de actualizaciones y última actualización */}
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <span className="font-medium text-indigo-600">
              {status.updateCount} actualizaciones
            </span>
            {status.lastUpdate && (
              <span className="text-gray-500">
                (última: {status.lastUpdate.toLocaleTimeString()})
              </span>
            )}
            {status.autoUpdateEnabled && status.nextUpdateTime && (
              <span className="text-gray-500">
                | próxima: {status.nextUpdateTime.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {/* Toggle para actualización automática */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto:</span>
            <button 
              onClick={toggleAutoUpdate}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${status.autoUpdateEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
              aria-pressed={status.autoUpdateEnabled}
            >
              <span className="sr-only">
                {status.autoUpdateEnabled ? 'Desactivar actualización automática' : 'Activar actualización automática'}
              </span>
              <span 
                className={`${status.autoUpdateEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
          
          {/* Botón de actualización manual */}
          <button 
            onClick={() => {
             
              
              // Limpiar indicadores de tiempo para forzar una actualización completa
              localStorage.removeItem('smartalgo_last_refresh_time');
              localStorage.removeItem('smartalgo_last_update_time');
              
              // Mostrar toast o alguna indicación visual
              // (opcional) Puedes agregar alguna librería de toast en el futuro
              
              // Invocar actualización
              manualUpdate();
              
              // Después de un breve retraso, actualizar UI con refreshData
              // Esto es para asegurar que incluso si manualUpdate falla, 
              // al menos intentamos cargar desde localStorage
              setTimeout(() => {
               
                refreshData();
              }, 2000);
            }}
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
      
      {/* Estadísticas básicas */}
      <StatsOverview />
      
      {/* ZellaScore y otros componentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ZellaScoreRadar />
        <div className="">
          <ProgressTrackerNew 
            handleDateRangeChange={(fromDate, toDate) => {
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

      <AccountChangeIndicator isChanging={isChangingAccount} account={selectedAccountNumber} />
    </div>
  );
} 
