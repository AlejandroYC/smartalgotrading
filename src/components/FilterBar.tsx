'use client';

import React, { useState, useEffect } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import DateRangeSelector from './DateRangeSelector';
import AccountSelector from './AccountSelector';

interface FilterBarProps {
  showAutoToggle?: boolean;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  showAutoToggle = true,
  className = "",
}) => {
  const { 
    dateRange, 
    setDateRange, 
    userAccounts, 
    currentAccount, 
    selectAccount,
    refreshData
  } = useTradingData();

  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(
    typeof localStorage !== "undefined" 
      ? localStorage.getItem("smartalgo_auto_update") === "true"
      : false
  );

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Guardar el estado del auto-update en localStorage
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("smartalgo_auto_update", autoUpdateEnabled.toString());
    }
    
    // Si está activado, iniciar el intervalo de actualización
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoUpdateEnabled) {
      intervalId = setInterval(() => {
        refreshData();
      }, 60000); // Actualizar cada minuto
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoUpdateEnabled, refreshData]);

  // Actualizar la hora de última actualización
  useEffect(() => {
    const updateTimeKey = "smartalgo_last_update_time";
    
    const handleStorageChange = () => {
      const lastUpdateTime = localStorage.getItem(updateTimeKey);
      if (lastUpdateTime) {
        setLastUpdate(new Date(parseInt(lastUpdateTime)));
      }
    };
    
    // Inicializar con el valor actual
    handleStorageChange();
    
    // Escuchar cambios en localStorage
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Toggle para la actualización automática
  const toggleAutoUpdate = () => {
    setAutoUpdateEnabled(prev => !prev);
  };
  
  // Actualización manual
  const triggerManualUpdate = () => {
    setIsUpdating(true);
    refreshData();
    
    // Actualizar el timestamp
    const now = new Date();
    setLastUpdate(now);
    
    // Guardar en localStorage para que otros componentes lo detecten
    localStorage.setItem("smartalgo_last_update_time", Date.now().toString());
    
    // Simular finalización de la actualización
    setTimeout(() => {
      setIsUpdating(false);
    }, 1000);
  };

  // Cambio de rango de fechas
  const handleDateRangeChange = (newRange: any) => {
    setDateRange(newRange);
    
    // Guardar selección en localStorage
    try {
      localStorage.setItem("smartalgo_current_date_range", JSON.stringify({
        startDate: newRange.startDate.toISOString(),
        endDate: newRange.endDate.toISOString(),
        label: newRange.label,
      }));
    } catch (error) {
      console.error("Error guardando rango de fechas:", error);
    }
  };
  
  // Cambio de cuenta
  const handleAccountSelect = (accountNumber: string) => {
    selectAccount(accountNumber);
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/*showAutoToggle && (
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Auto:</span>
          <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200">
            <span className="sr-only">
              {autoUpdateEnabled ? 'Desactivar actualización automática' : 'Activar actualización automática'}
            </span>
            <span
              className={`${autoUpdateEnabled ? 'translate-x-6 bg-indigo-600' : 'translate-x-1 bg-white'} 
                inline-block h-4 w-4 transform rounded-full transition-transform shadow ring-0`}
              onClick={toggleAutoUpdate}
            />
          </div>
        </div>
      )*/}
      
      <DateRangeSelector 
        onDateRangeChange={handleDateRangeChange}
        className="text-sm"
      />
      
      <AccountSelector 
        accounts={userAccounts}
        currentAccount={currentAccount}
        onSelectAccount={handleAccountSelect}
        className="text-sm"
      />
    </div>
  );
};

export default FilterBar; 