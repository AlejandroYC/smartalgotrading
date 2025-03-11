'use client';

import { useEffect, useState } from 'react';
import { LocalStorageService } from '@/services/LocalStorageService';
import { useAuth } from '@/hooks/useAuth';

export default function StorageTest() {
  const [testResult, setTestResult] = useState<{success: boolean, message: string}>({
    success: false,
    message: 'Prueba no iniciada'
  });
  
  const { user } = useAuth();
  
  useEffect(() => {
    try {
      // Probar acceso general a localStorage
      const storageWorks = LocalStorageService.testStorage();
      
      if (!storageWorks) {
        setTestResult({
          success: false,
          message: 'LocalStorage no funciona en este navegador'
        });
        return;
      }
      
      // Verificar si hay usuario autenticado
      if (!user?.id) {
        setTestResult({
          success: false,
          message: 'Usuario no autenticado, imposible verificar datos'
        });
        return;
      }
      
      // Verificar datos guardados
      const accounts = LocalStorageService.getUserAccounts(user.id);
      const accountsCount = Object.keys(accounts).length;
      
      if (accountsCount === 0) {
        setTestResult({
          success: false,
          message: 'No hay cuentas guardadas para este usuario'
        });
        return;
      }
      
      // Verificar cuenta activa
      const lastActive = LocalStorageService.getLastActiveAccount(user.id);
      
      if (!lastActive) {
        setTestResult({
          success: false,
          message: `Hay ${accountsCount} cuentas guardadas pero ninguna activa`
        });
        return;
      }
      
      setTestResult({
        success: true,
        message: `LocalStorage funciona correctamente. Hay ${accountsCount} cuentas guardadas y una cuenta activa (${lastActive.accountNumber})`
      });
      
    } catch (e) {
      console.error("Error en diagnóstico:", e);
      setTestResult({
        success: false,
        message: `Error en diagnóstico: ${e instanceof Error ? e.message : String(e)}`
      });
    }
  }, [user]);
  
  return (
    <div className="fixed bottom-4 left-4 p-4 bg-white shadow-lg rounded-lg z-50 max-w-md">
      <h3 className="font-bold mb-2">Diagnóstico de LocalStorage</h3>
      <div className={`p-3 rounded ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
        {testResult.message}
      </div>
      <button 
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => window.location.reload()}
      >
        Recargar página
      </button>
    </div>
  );
} 