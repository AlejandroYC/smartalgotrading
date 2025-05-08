"use client";

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import { SafeZellaScoreRadar } from '@/components/SafeZellaScoreRadar';
import { useAuthContext } from '@/providers/AuthProvider';
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
import AccountSelector from '@/components/AccountSelector';
import { FullScreenLoading, LoadingIndicator, ButtonLoading } from '@/components/LoadingIndicator';
import Link from 'next/link';
import ChartErrorBoundary from '@/components/ChartErrorBoundary';
import { HangTightLoading } from '@/components/HangTightLoading';
import StartMyDayButton from '@/components/StartMyDayButton';
import { useSidebar } from '@/contexts/SidebarContext';





// Componente ClientOnly para asegurar renderizado solo del lado del cliente
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

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
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

    // Verificar localStorage
    const storageKeys: Array<{ key: string, value: string | null }> = [];
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
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

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
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

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
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return;

    const diagnosticInfo: {
      activeKeys: Array<{ key: string, value: string | null }>,
      dataKeys: Array<{
        key: string,
        size?: number,
        hasHistory?: boolean,
        historyItems?: number,
        hasStatistics?: boolean,
        lastUpdated?: string,
        error?: string
      }>,
      otherKeys: Array<{ key: string, value: string | null }>
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
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow mt-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Panel de Diagnóstico</h3>

      {/* Información de conexión a la API */}
      <div className="mb-4 p-2 sm:p-3 bg-gray-50 rounded border border-gray-200">
        <h4 className="text-md font-semibold mb-2">Configuración de API</h4>

        <div className="mb-2">
          <p className="text-sm text-gray-700">URL actual: <code className="bg-gray-100 px-1 rounded break-all">{mt5ApiUrl || 'No configurada'}</code></p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mb-2">
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="Ej: https://18.225.209.243.nip.io"
            className="text-sm border border-gray-300 rounded px-2 py-1 w-full sm:w-auto sm:flex-grow"
          />
          <button
            onClick={updateApiUrl}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
          >
            Actualizar URL
          </button>
        </div>

        <div className="text-xs text-gray-600">
          <p>Nota: Cambiar la URL puede causar problemas de conexión si no es correcta.</p>
          <p>La URL debe tener el formato completo, incluyendo https://</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
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
            if (typeof window !== 'undefined') {
              localStorage.setItem('smartalgo_current_account', currentAccount || "34061170");
              runDiagnostics();
            }
          }}
          className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Configurar cuenta actual
        </button>

        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('smartalgo_last_refresh_time');
              localStorage.removeItem('smartalgo_last_update_time');
              runDiagnostics();
            }
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
            // Verificar que estamos en el cliente
            if (typeof window === 'undefined') return;

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
            // Verificar que estamos en el cliente
            if (typeof window === 'undefined') return;

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

// Componente mejorado para mostrar el cambio de cuenta
const AccountChangeIndicator = ({ isChanging, account }: { isChanging: boolean, account: string | null }) => {
  if (!isChanging) return null;

  return (
    <div className="w-full h-full">
      <HangTightLoading
        message="Cambiando cuenta"
        description={`Preparando datos para la cuenta ${account}`}
        fullScreen={false}
      />
    </div>
  );
};

// Componente mejorado para mostrar el cambio de rango de fechas
const DateRangeChangeIndicator = ({ isChanging, dateRange }: {
  isChanging: boolean,
  dateRange: { startDate?: Date, endDate?: Date } | null
}) => {
  if (!isChanging || !dateRange || !dateRange.startDate || !dateRange.endDate) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full h-full">
      <HangTightLoading
        message="Actualizando datos"
        description={`${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`}
        fullScreen={false}
      />
    </div>
  );
};

// Componente principal del Dashboard
function DashboardContent() {
  // Obtener el usuario del contexto de autenticación
  const { user } = useAuthContext();

  const {
    loading: isLoading,
    error,
    processedData,
    refreshData,
    dateRange,
    setDateRange,
    userAccounts,
    currentAccount,
    selectAccount,
    loadUserAccounts,
    hasNoAccounts
  } = useTradingData();

  

  // Referencias para controlar el estado de la carga de datos
  const skipDataLoading = useRef(false);
  const initialized = useRef(false);
  const isInternalNavRef = useRef(false);

  // Estados para UI - Inicialmente no mostrar loading hasta evaluar si es necesario
  const [isContentLoading, setIsContentLoading] = useState(false);

  // Llamar al hook directamente en el nivel superior del componente
  // siguiendo las reglas de Hooks de React
  const { status, manualUpdate, toggleAutoUpdate } = useAutoUpdate(user?.id);

  // Dentro del componente Dashboard, agregar estado para el cambio de cuenta
  const [isChangingAccount, setIsChangingAccount] = useState(false);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState<string | null>(null);

  // Nuevo estado para controlar cuando se está cambiando el rango de fechas
  const [isChangingDateRange, setIsChangingDateRange] = useState(false);

  // Efecto para limpiar cualquier flag de loading que pudiera haber quedado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Si hay un flag de loading presente por más de 30 segundos, es probablemente un error
      const loadingFlag = sessionStorage.getItem('dashboard_loading_in_progress');
      if (loadingFlag) {
        const timestamp = parseInt(loadingFlag);
        const now = Date.now();

        if (isNaN(timestamp) || now - timestamp > 30000) {
          console.log('🧹 Limpiando flag de loading antiguo');
          sessionStorage.removeItem('dashboard_loading_in_progress');
        }
      }
    }
  }, []);

  

  // Efecto para verificar si debemos saltar la carga de datos (se ejecuta solo una vez al montar)
  useEffect(() => {
    console.log('🔍 Verificando flags de navegación y caché...');

    // Verificar si ya se cargaron los datos después del login
    const dataAlreadyLoaded = sessionStorage.getItem('dashboard_data_loaded');

    // Verificar si estamos navegando internamente desde otra página
    const isInternalNavigation = sessionStorage.getItem('dashboard_internal_navigation');

    if (isInternalNavigation && dataAlreadyLoaded) {
      console.log('🚶‍♂️ Navegación interna detectada y datos ya cargados');
      // Marcar que debemos saltar la carga de datos
      skipDataLoading.current = true;
      // Marcar que venimos de navegación interna (para controlar el auto-update)
      isInternalNavRef.current = true;
      // Limpiar el flag de navegación interna
      sessionStorage.removeItem('dashboard_internal_navigation');
    } else if (dataAlreadyLoaded) {
      console.log('💾 Datos ya cargados previamente');
      // Si ya hay datos cargados pero no es navegación interna, decidiremos en el siguiente efecto
    } else {
      console.log('🔄 Primera carga o datos no encontrados, se realizará carga completa');
      skipDataLoading.current = false;
    }

    return () => {
      // Limpiar referencia al desmontar
      console.log('🧹 Limpiando referencias al desmontar componente');
    };
  }, []);

  // Manejar actualización de datos manualmente
  const handleManualUpdate = useCallback(() => {
    console.log('🔄 Solicitud manual de actualización iniciada por el usuario');

    // Limpiar indicadores de tiempo para forzar una actualización completa
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smartalgo_last_refresh_time');
      localStorage.removeItem('smartalgo_last_update_time');
      localStorage.removeItem('dashboard_last_load_timestamp'); // Limpiar el timestamp para permitir recarga manual
    }

    refreshData();

    // Evitamos llamar a manualUpdate inmediatamente después de refreshData
    const updateTimer = setTimeout(() => {
      manualUpdate();
    }, 1000);

    return () => clearTimeout(updateTimer);
  }, [refreshData, manualUpdate]);

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

  // Nueva función para manejar el cambio de rango de fechas
  const handleDateRangeChange = useCallback((range: any) => {
    setIsChangingDateRange(true);

    // Actualizar el rango de fechas
    setDateRange(range);

    // El tiempo dependerá del volumen de datos y la complejidad del procesamiento
    const processingTimeout = setTimeout(() => {
      setIsChangingDateRange(false);
    }, 1500); // Ajustable según la complejidad del procesamiento

    return () => clearTimeout(processingTimeout);
  }, [setDateRange]);

  // Efecto para cargar datos iniciales - Completamente revisado
  useEffect(() => {
    // Si no hay usuario autenticado, no cargar nada
    if (!user?.id) {
      console.log('⚠️ No hay usuario autenticado, no se cargarán datos');
      setIsContentLoading(false); // Asegurar que el loading se apaga
      return;
    }

    // Si se debe saltar la carga (navegación interna con datos ya cargados)
    if (skipDataLoading.current) {
      console.log('⏭️ Saltando carga de datos (navegación interna con datos ya cargados)');
      setIsContentLoading(false); // Asegurar que el loading se apaga
      return;
    }

    // Si el componente ya fue inicializado previamente
    if (initialized.current) {
      console.log('🔁 Dashboard ya inicializado, no se cargarán datos nuevamente');
      setIsContentLoading(false); // Asegurar que el loading se apaga
      return;
    }

    // Marcar como inicializado para evitar cargas duplicadas
    initialized.current = true;

    // Establecer indicador de carga
    setIsContentLoading(true);
    console.log('🚀 Inicializando dashboard para usuario:', user.id);

    // Limpiar cualquier indicador previo que pudiera haber quedado
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dashboard_loading_in_progress');
    }

    // Validar si hay una carga en progreso para evitar duplicados
    if (sessionStorage.getItem('dashboard_loading_in_progress') === 'true') {
      console.log('⚠️ Ya hay una carga en progreso, evitando duplicación');
      return;
    }

    // Establecer flag de carga en progreso
    sessionStorage.setItem('dashboard_loading_in_progress', Date.now().toString());

    // Establecer timeout de seguridad para evitar loading infinito
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Timeout de seguridad activado para evitar loading infinito');
      setIsContentLoading(false);
      sessionStorage.removeItem('dashboard_loading_in_progress');
    }, 15000); // 15 segundos máximo de loading

    // Función asíncrona para cargar datos sin bloquear la UI
    const loadData = async () => {
      try {
        // Cargar cuentas del usuario
        console.log('📊 Cargando cuentas de usuario...');
        await loadUserAccounts();

        // Si hay una cuenta seleccionada, cargar datos específicos
        if (currentAccount) {
          console.log('💼 Cargando datos para cuenta:', currentAccount);
          await refreshData();

          // Establecer indicador de datos cargados para futuras navegaciones
          sessionStorage.setItem('dashboard_data_loaded', 'true');

          // Registrar timestamp de última carga para control de frecuencia
          localStorage.setItem('dashboard_last_load_timestamp', Date.now().toString());

          console.log('✅ Datos del dashboard cargados exitosamente');
        } else {
          console.log('⚠️ No hay cuenta seleccionada, no se cargarán datos específicos');
        }
      } catch (error) {
        console.error('❌ Error cargando datos del dashboard:', error);
      } finally {
        // Cancelar el timeout de seguridad
        clearTimeout(safetyTimeout);

        // Limpiar estado de carga y flags
        setIsContentLoading(false);
        sessionStorage.removeItem('dashboard_loading_in_progress');
      }
    };

    // Ejecutar carga de datos
    loadData();

    // Cleanup function
    return () => {
      console.log('🧹 Limpiando efectos al desmontar dashboard');
      // Asegurar que se limpian los indicadores al desmontar
      clearTimeout(safetyTimeout);
      setIsContentLoading(false);
      sessionStorage.removeItem('dashboard_loading_in_progress');
    };

  }, [user?.id, currentAccount]); // Solo re-ejecutar cuando el usuario o la cuenta cambie

  // Efecto para controlar las actualizaciones
  useEffect(() => {
    // Si hay actualizaciones automáticas activas, no permitiremos actualizaciones por un tiempo
    if (status.autoUpdateEnabled && !status.isUpdating) {
      // Crear una marca de tiempo para rastrear cuándo fue la última actualización manual
      const lastManualUpdateTime = localStorage.getItem('dashboard_last_manual_update');
      const currentTime = Date.now();

      // Si no hay actualización manual reciente o han pasado más de 30 segundos
      if (!lastManualUpdateTime || (currentTime - parseInt(lastManualUpdateTime)) > 30000) {
        // Detectar si venimos de navegación interna y evitar actualizaciones
        if (isInternalNavRef.current) {
          console.log('🔍 Detección de navegación interna: evitando actualizaciones inmediatas');

          // Programar una comprobación después de un retraso
          const updateCheckTimer = setTimeout(() => {
            console.log('🔍 Comprobando si podemos continuar con actualizaciones automáticas');
            isInternalNavRef.current = false;
          }, 10000); // 10 segundos

          return () => clearTimeout(updateCheckTimer);
        }
      }
    }
  }, [status.autoUpdateEnabled, status.isUpdating]);

  // Función para actualizar manualmente con marcas de tiempo
  const triggerManualUpdate = useCallback(() => {
    // Establecer marca de tiempo de actualización manual
    localStorage.setItem('dashboard_last_manual_update', Date.now().toString());
    // Ejecutar actualización manual
    handleManualUpdate();
  }, [handleManualUpdate]);

  // Mostrar la pantalla de carga durante la carga de contenido
  if (isLoading || isContentLoading) {
    return (
      <div className="w-full h-full">
        <HangTightLoading
          message="Actualizando Dashboard"
          description="Estamos procesando tus datos financieros"
          fullScreen={false}
        />
      </div>
    );
  }

  // Mostrar mensaje elegante cuando el usuario no tiene cuentas
  if (hasNoAccounts) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between p-3 sm:p-6 bg-white shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">SmartAlgoTrading</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>

              <h2 className="text-lg sm:text-xl font-semibold text-center mb-2 text-gray-800">Bienvenido a tu Dashboard</h2>

              <p className="text-gray-600 text-center mb-6">
                Para comenzar a utilizar el dashboard, necesitas conectar una cuenta de MetaTrader 5.
              </p>

              <div className="flex justify-center">
                <Link
                  href="/settings/accounts"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-center"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Conectar Cuenta MT5
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar errores
  if (!isLoading && error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="bg-red-600 p-4">
            <div className="flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white text-center">Error al cargar el dashboard</h3>
          </div>

          <div className="p-4 sm:p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">
              {error === 'no-accounts' && 'No se encontraron cuentas configuradas para este usuario.'}
              {error === 'no-account-data' && 'No se pudieron obtener datos para la cuenta seleccionada.'}
              {error === 'account-error' && 'Se produjo un error al cargar los datos de la cuenta.'}
              {error === 'multiple-errors' && 'Se produjeron múltiples errores al cargar los datos.'}
              {!['no-accounts', 'no-account-data', 'account-error', 'multiple-errors'].includes(error) && error}
            </p>

            <div className="flex flex-col space-y-3">
              <button
                onClick={refreshData}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-200 flex items-center justify-center text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refrescar datos
              </button>

              <button
                onClick={() => window.location.reload()}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition duration-200 flex items-center justify-center text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recargar página
              </button>

              {error === 'no-accounts' && (
                <Link
                  href="/settings/accounts"
                  className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Configurar cuentas
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Volver a la validación original, que solo comprueba si processedData existe
  if (!processedData) {
    return (
      <div>
        <div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 text-black">
   <div className="
  flex flex-row items-center justify-between flex-wrap
  pl-[16px] lg:pl-[30px] pr-[30px] pt-[16px] pb-[16px] bg-white
  shadow-sm shadow-[0_1px_3px_rgba(0,0,0,0.12)]
">
   <div className="flex items-center">
    {/* Botón de menú móvil */}
    <button
      onClick={() => setMobileSidebarsOpen(!mobileSidebarsOpen)}
      className="lg:hidden mr-3 p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
      aria-label="Menú principal"
    >
      {/* Icono del menú hamburguesa */}
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    
    {/* Logo (solo visible en móvil/tablet) */}
    <img 
      src="/lmc-trade-morado.webp" 
      alt="Logo LMC Trade" 
      className="w-16 h-8 mr-3 md:hidden" // 👈 `lg:hidden` lo oculta en pantallas grandes
    />
    
    <h1 className="text-xl text-[24px] font-semibold mb-0">Dashboard</h1>
  </div>
  
  <div className="flex flex-row items-center space-x-2 h-[44px]">
    {/* Toggle para actualización automática */}
    <div className="flex items-center space-x-2">
      <span className="hidden sm:inline text-sm text-gray-600">Auto:</span>
      <button
        onClick={toggleAutoUpdate}
        className={`hidden sm:flex relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${status.autoUpdateEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
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

    <div onClick={(e) => e.stopPropagation()}>
      <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
    </div>

    {/* Selector de cuentas */}
    {userAccounts.length > 0 && (
      <div className="w-full sm:w-auto max-w-xs">
        <AccountSelector
          accounts={userAccounts}
          currentAccount={currentAccount}
          onSelectAccount={handleAccountSelect}
          className="w-full"
        />
      </div>
    )}
  </div>
</div>

      {status.error && (
        <div className="mb-4 pr-8 bg-red-50 border border-red-200 text-red-700 rounded text-sm ">
          Error: {status.error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between  sm:items-center px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex flex-row items-center justify-between gap-4">
          {status.lastUpdate && (
            <div className="text-xs text-gray-500 mb-3 sm:mb-0">
              Última actualización: {status.lastUpdate.toLocaleString()}
            </div>
          )}
          {/* Botón de actualización manual */}
          <button
            onClick={triggerManualUpdate}
            disabled={status.isUpdating}
            className="font-semibold text-[14px] text-[#6457A6] underline hover:text-[#513aa6]
            bg-transparent hover:bg-[#352E77]/10 p-1.5 rounded
            transition-all duration-300 ease-in-out"
          >
            Actualizar datos
          </button>
        </div>

        <div>
          <StartMyDayButton />
        </div>
      </div>

      {/* Estadísticas básicas */}
      <div className="px-4 sm:px-6">
        <StatsOverview />
      </div>

      <div class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-2 sm:px-4 overflow-x-hidden min-w-0">
  <ChartErrorBoundary key="zella-score-radar">
    <div className="w-full">
      <SafeZellaScoreRadar />
    </div>
  </ChartErrorBoundary>






        <ChartErrorBoundary key="progress-tracker">
        <div className="w-full">
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
        </ChartErrorBoundary>

        <ChartErrorBoundary key="daily-net-cumulative">
          <div className="w-full">
            <DailyNetCumulativePL dailyResults={processedData.daily_results} />
          </div>
        </ChartErrorBoundary>

        <ChartErrorBoundary key="net-daily-pl">
          <div className="w-full">
            <NetDailyPL dailyResults={processedData.daily_results} />
          </div>
        </ChartErrorBoundary>

        <ChartErrorBoundary key="recent-trades">
          <div className="w-full">
            <RecentTradesSection />
          </div>
        </ChartErrorBoundary>

        <ChartErrorBoundary key="trade-time-performance">
          <div className="w-full">
            <TradeTimePerformance />
          </div>
        </ChartErrorBoundary>
      </div>

      <div className="w-full px-4 sm:px-6 py-4 hidden sm:block">
  <ChartErrorBoundary key="trading-calendar">
    <div className="w-full">
      <TradingCalendar />
    </div>
  </ChartErrorBoundary>
</div>

      <AccountChangeIndicator isChanging={isChangingAccount} account={selectedAccountNumber} />
      <DateRangeChangeIndicator
        isChanging={isChangingDateRange}
        dateRange={dateRange}
      />
    </div>
  );
}

export default function Dashboard() {
  const { loading: isLoading, error } = useTradingData();

  // Usar localStorage en lugar de sessionStorage para manejar el estado entre páginas
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      // Si venimos del login, no mostrar loading
      if (sessionStorage.getItem('coming_from_login') === 'true') {
        // Limpiar la bandera
        sessionStorage.removeItem('coming_from_login');
        return false;
      }
    }
    return true;
  });

  

  const { user, session } = useAuthContext();
  
  // Detectar redirección de autenticación para manejar correctamente la carga
  useEffect(() => {
    // Verificar si hay una cookie de redirección de autenticación
    const checkAuthRedirect = () => {
      if (typeof document === 'undefined') return;
      
      // Buscar la cookie auth_redirect
      const cookies = document.cookie.split(';');
      const hasAuthRedirect = cookies.some(cookie => 
        cookie.trim().startsWith('auth_redirect=')
      );
      
      if (hasAuthRedirect) {
        console.log('Detectada redirección de autenticación, configurando estado de navegación');
        // Establecer el flag de redirección desde login
        sessionStorage.setItem('coming_from_login', 'true');
        // Forzar actualización de datos
        sessionStorage.setItem('force_dashboard_update', 'true');
        // No mostrar la carga inicial
        setIsInitialLoading(false);
        
        // Eliminar la cookie ya que la hemos detectado
        document.cookie = 'auth_redirect=; Max-Age=0; Path=/; SameSite=Strict';
      }
    };
    
    checkAuthRedirect();
  }, []);

  // Mostrar dashboard rápidamente
  useEffect(() => {
    if (!isInitialLoading) return;

    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 600); // Reducir tiempo a 600ms

    return () => clearTimeout(timer);
  }, [isInitialLoading]);

  if (isInitialLoading) {
    return (
      <HangTightLoading
        message="Preparando tu experiencia"
        description="Estamos verificando tu información"
        fullScreen={true}
      />
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen w-full">
      <ClientOnly>
        <DashboardContent />
      </ClientOnly>
    </div>
  );
}
