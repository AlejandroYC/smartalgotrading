import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useLogout } from './useLogout';

// Cliente de Supabase a nivel de módulo (instancia única)
const supabaseClient = createClientComponentClient();

// Caché para evitar múltiples verificaciones
let cachedSession: Session | null = null;
let lastCheck = 0;
const CACHE_TIME = 60000; // 1 minuto

// Agregar estas variables para controlar el throttling de login
let lastLoginAttempt = 0;
const LOGIN_THROTTLE_MS = 2000; // 2 segundos entre intentos

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logout: performLogout } = useLogout();
  
  // Referencia para evitar múltiples verificaciones simultáneas
  const isCheckingRef = useRef(false);

  // Función para obtener la sesión con caché
  const getSessionSafely = useCallback(async () => {
    // Evitar verificaciones simultáneas
    if (isCheckingRef.current) return null;
    
    // Usar caché si disponible y reciente
    const now = Date.now();
    if (cachedSession && (now - lastCheck < CACHE_TIME)) {
      return { session: cachedSession };
    }
    
    try {
      isCheckingRef.current = true;
      const { data } = await supabaseClient.auth.getSession();
      
      // Actualizar caché
      cachedSession = data.session;
      lastCheck = now;
      
      return data;
    } catch (error) {
      console.error('Error getting session:', error);
      return { session: null };
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      try {
        const data = await getSessionSafely();
        if (data) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Configurar suscripción una sola vez
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
      // Actualizar caché inmediatamente
      cachedSession = currentSession;
      lastCheck = Date.now();
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [getSessionSafely]);

  const signIn = async (email: string, password: string) => {
    try {
      // Verificar si hay un intento reciente de login
      const now = Date.now();
      if (now - lastLoginAttempt < LOGIN_THROTTLE_MS) {
        throw new Error('Por favor, espera un momento antes de intentar nuevamente');
      }
      
      // Marcar este intento
      lastLoginAttempt = now;
      
      setIsLoading(true);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos'
            : error.message
        );
      }

      // Actualizar caché inmediatamente
      cachedSession = data.session;
      lastCheck = now;
      
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data?.user?.identities?.length === 0) {
      throw new Error('Este email ya está registrado.');
    }

    return data;
  };

  const signOut = async () => {
    try {
      console.log('useAuth: iniciando signOut');
      setIsLoading(true);
      
      // Limpiar el estado de la sesión inmediatamente para evitar navegaciones no deseadas
      setUser(null);
      setSession(null);
      
      // Utilizar el hook de logout que maneja la limpieza de localStorage y la redirección
      await performLogout();
      
    } catch (error) {
      console.error('Error during sign out:', error);
      // En caso de error, intentar redirigir manualmente
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    user, 
    session, 
    signIn, 
    signUp, 
    signOut,
    isLoading 
  };
}; 