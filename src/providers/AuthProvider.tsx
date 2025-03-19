'use client'
// src/providers/AuthProvider.tsx
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

type AuthContextType = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Este es el ÚNICO lugar donde useAuth debe ser usado
  const auth = useAuth();
  
  // Se eliminó el detector de inactividad para mejorar la experiencia del usuario
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Este hook reemplaza TODOS los usos directos de useAuth en tu aplicación
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Eliminar este bloque de código de ejemplo
// Buscar la función signOut y añadir limpieza de sessionStorage

// Si la función tiene una estructura como esta:
const signOut = async () => {
  // ... código existente ...
  
  try {
    // Antes de cerrar sesión, limpiar el indicador de datos cargados
    sessionStorage.removeItem('dashboard_data_loaded');
    
    // ... resto del código de cierre de sesión ...
  } catch (error) {
    // ... manejo de errores ...
  }
};