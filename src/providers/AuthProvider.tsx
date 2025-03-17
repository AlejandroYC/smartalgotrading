'use client'
// src/providers/AuthProvider.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';


type AuthContextType = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Este es el ÚNICO lugar donde useAuth debe ser usado
  const auth = useAuth();
  
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