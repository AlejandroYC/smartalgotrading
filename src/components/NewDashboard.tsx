'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LocalStorageServiceNew as LocalStorageService } from '@/services/LocalStorageServiceNew';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';

export default function NewDashboard() {
  const { user } = useAuth();
  const { status } = useAutoUpdate(user?.id);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-black">Dashboard</h1>
      
      {/* Contador de actualizaciones */}
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Estado de sincronización:</span>
            {status.isUpdating ? (
              <span className="text-blue-500">Actualizando...</span>
            ) : status.error ? (
              <span className="text-red-500">{status.error}</span>
            ) : (
              <span className="text-green-500">Sincronizado</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Última actualización: {status.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : 'Nunca'}
            </div>
            <div className="text-sm font-medium text-blue-600">
              Total actualizaciones: {status.updateCount}
            </div>
          </div>
        </div>
      </div>

      {/* Resto del contenido */}
    </div>
  );
} 