import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useLogout } from './useLogout';

// Variables de control globales para evitar múltiples solicitudes
let isAuthOperationInProgress = false;
let globalPendingAuthRequest: Promise<any> | null = null;
let authOperationTimeout: NodeJS.Timeout | null = null;
let authSubscription: { unsubscribe: () => void } | null = null;
let isAppActive = true; // Siempre activa para mejorar la experiencia del usuario

// Caché para evitar múltiples verificaciones
let cachedSession: Session | null = null;
let lastCheck = 0;
const CACHE_TIME = 1800000; // 30 minutos (aumentado significativamente)

// Variables para controlar el throttling de login
let lastLoginAttempt = 0;
const LOGIN_THROTTLE_MS = 10000; // 10 segundos entre intentos
const AUTH_OPERATION_TIMEOUT = 15000; // 15 segundos de timeout para operaciones de autenticación

// Crear cliente Supabase solo cuando sea necesario
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null;

// Función para obtener el cliente de Supabase (lazy initialization)
const getSupabaseClient = () => {
  if (!supabaseClient) {
    console.log('[Auth] Creando nuevo cliente de Supabase');
    supabaseClient = createClientComponentClient();
  }
  return supabaseClient;
};

// Función para limpiar recursos completamente
const cleanupResources = () => {
  console.log('[Auth] Limpiando recursos de autenticación');
  
  // Limpiar timeout si existe
  if (authOperationTimeout) {
    clearTimeout(authOperationTimeout);
    authOperationTimeout = null;
  }
  
  // Desuscribir de eventos de autenticación
  if (authSubscription) {
    authSubscription.unsubscribe();
    authSubscription = null;
  }
  
  // Reiniciar variables de estado
  isAuthOperationInProgress = false;
  globalPendingAuthRequest = null;
};

// Función para limpiar el estado de la operación de autenticación
const resetAuthOperationState = () => {
  isAuthOperationInProgress = false;
  globalPendingAuthRequest = null;
  if (authOperationTimeout) {
    clearTimeout(authOperationTimeout);
    authOperationTimeout = null;
  }
};

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logout: performLogout } = useLogout();
  
  // Referencia para evitar múltiples verificaciones simultáneas
  const isCheckingRef = useRef(false);
  const isComponentMounted = useRef(true);

  // Función para obtener la sesión con caché
  const getSessionSafely = useCallback(async () => {
    // Simplificado: ya no comprobamos si la app está activa
    // Si hay una caché válida, devolverla
    if (cachedSession && Date.now() - lastCheck < CACHE_TIME) {
      console.log('[Auth] Usando sesión en caché');
      return { session: cachedSession };
    }
    
    // Si ya hay una operación en curso, usar la caché
    if (isAuthOperationInProgress) {
      console.log('[Auth] Operación en curso, usando caché');
      return { session: cachedSession };
    }
    
    console.log('[Auth] Verificando sesión en Supabase');
    try {
      isAuthOperationInProgress = true;
      
      // Obtener cliente de Supabase
      const supabase = getSupabaseClient();
      
      // Obtener sesión
      const { data, error } = await supabase.auth.getSession();
      
      // Actualizar caché
      if (!error) {
        cachedSession = data.session;
        lastCheck = Date.now();
      }
      
      // Registrar resultado
      console.log(`[Auth] Resultado de getSession: ${data.session ? 'sesión activa' : 'sin sesión'}`);
      
      return data;
    } catch (error) {
      console.error('[Auth] Error obteniendo sesión:', error);
      return { session: cachedSession };
    } finally {
      isAuthOperationInProgress = false;
    }
  }, []);

  useEffect(() => {
    console.log('[Auth] Hook inicializado');
    isComponentMounted.current = true;
    isAppActive = true;
    
    const initSession = async () => {
      try {
        console.log('[Auth] Inicializando sesión');
        const data = await getSessionSafely();
        
        // Verificar si el componente sigue montado antes de actualizar estado
        if (isComponentMounted.current) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error('[Auth] Error initializing session:', error);
      } finally {
        if (isComponentMounted.current) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // Configurar suscripción una sola vez
    if (!authSubscription) {
      console.log('[Auth] Configurando suscripción de autenticación');
      const { data: { subscription } } = getSupabaseClient().auth.onAuthStateChange((event, currentSession) => {
        console.log(`[Auth] Evento de autenticación: ${event}`);
        
        // Actualizar caché inmediatamente
        cachedSession = currentSession;
        lastCheck = Date.now();
        
        // Verificar si el componente sigue montado antes de actualizar estado
        if (isComponentMounted.current) {
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
          } else {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
          }
        }
      });
      
      authSubscription = subscription;
    }

    // Cleanup function
    return () => {
      console.log('[Auth] Hook desmontado');
      isComponentMounted.current = false;
      
      // Realizar limpieza solo si no hay otros componentes que usen el hook
      // En una aplicación real, se podría implementar un contador de referencias
      // Por ahora, solo limpiamos la suscripción si existe
      if (authSubscription) {
        console.log('[Auth] Desuscribiendo eventos de autenticación');
        authSubscription.unsubscribe();
        authSubscription = null;
      }
    };
  }, [getSessionSafely]);

  const signIn = async (email: string, password: string) => {
    // Si la app no está activa, rechazar la operación
    if (!isAppActive || !isComponentMounted.current) {
      console.warn('[Auth] Intento de login cuando la app está inactiva o componente desmontado');
      throw new Error('La aplicación está en segundo plano. Por favor, recarga la página');
    }
    
    // Si hay otra operación de autenticación en curso, bloquear
    if (isAuthOperationInProgress) {
      console.warn('[Auth] Operación de autenticación ya en curso');
      throw new Error('Operación en curso. Por favor, espera un momento antes de intentar nuevamente');
    }
    
    try {
      // Verificar si hay un intento reciente de login
      const now = Date.now();
      if (now - lastLoginAttempt < LOGIN_THROTTLE_MS) {
        console.warn('[Auth] Intento de login muy frecuente');
        throw new Error('Por favor, espera un momento antes de intentar nuevamente');
      }
      
      // Marcar este intento y bloquear otras operaciones
      lastLoginAttempt = now;
      isAuthOperationInProgress = true;
      
      // Configurar timeout para evitar bloqueos permanentes
      authOperationTimeout = setTimeout(() => {
        console.error('[Auth] Timeout en operación de login');
        resetAuthOperationState();
      }, AUTH_OPERATION_TIMEOUT);
      
      console.log('[Auth] Iniciando proceso de login');
      setIsLoading(true);
      
      // Realizar solicitud de login de forma optimizada
      let result;
      try {
        // Usar un timeout más corto para la solicitud de login específicamente
        const loginPromise = getSupabaseClient().auth.signInWithPassword({
          email,
          password,
        });
        
        // Crear una promesa con timeout para la operación de login
        result = await loginPromise;
      } catch (supabaseError) {
        // Capturar errores de red o problemas con la API de Supabase
        console.error('[Auth] Error en la API de Supabase:', supabaseError);
        throw new Error('Error de conexión con el servidor. Por favor, intenta más tarde.');
      }
      
      const { data, error } = result;

      if (error) {
        console.error('[Auth] Error de login:', error.message);
        
        // Traducir mensajes comunes de error de Supabase a mensajes amigables en español
        let errorMessage: string;
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Email o contraseña incorrectos';
            break;
          case 'Email not confirmed':
            errorMessage = 'Email no confirmado. Por favor, verifica tu correo';
            break;
          case 'Too many requests':
            errorMessage = 'Demasiados intentos fallidos. Por favor espera antes de intentar nuevamente';
            break;
          default:
            errorMessage = error.message;
        }
        
        // Asegurarnos de reiniciar el estado antes de lanzar el error
        setIsLoading(false);
        resetAuthOperationState();
        
        // Crear un nuevo error con el mensaje traducido para que sea capturado por el componente
        throw new Error(errorMessage);
      }

      // Login exitoso: actualizar caché inmediatamente sin esperas adicionales
      console.log('[Auth] Login exitoso - actualizando estado');
      cachedSession = data.session;
      lastCheck = now;
      
      // Limpiar estado de operación pero mantener isLoading=true hasta que se complete la redirección
      resetAuthOperationState();
      
      return data;
    } catch (error) {
      // Agregar más diagnóstico
      console.error('[Auth] Error durante signIn:', error);
      
      // Asegurarnos de que el estado se limpia si hay un error
      setIsLoading(false);
      resetAuthOperationState();
      
      // Rethrow para que el componente pueda capturar el error
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Si la app no está activa, rechazar la operación
    if (!isAppActive || !isComponentMounted.current) {
      console.warn('[Auth] Intento de registro cuando la app está inactiva o componente desmontado');
      throw new Error('La aplicación está en segundo plano. Por favor, recarga la página');
    }
    
    // Si hay otra operación de autenticación en curso, bloquear
    if (isAuthOperationInProgress) {
      console.warn('[Auth] Operación de autenticación ya en curso');
      throw new Error('Operación en curso. Por favor, espera un momento');
    }
    
    try {
      console.log('[Auth] Iniciando proceso de registro');
      isAuthOperationInProgress = true;
      
      // Configurar timeout para evitar bloqueos permanentes
      authOperationTimeout = setTimeout(() => {
        console.error('[Auth] Timeout en operación de registro');
        resetAuthOperationState();
      }, AUTH_OPERATION_TIMEOUT);
      
      const { data, error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('[Auth] Error de registro:', error.message);
        throw error;
      }

      if (data?.user?.identities?.length === 0) {
        console.warn('[Auth] Email ya registrado');
        throw new Error('Este email ya está registrado.');
      }

      console.log('[Auth] Registro exitoso');
      return data;
    } finally {
      resetAuthOperationState();
    }
  };

  const signOut = async () => {
    // Si la app no está activa, rechazar la operación
    if (!isAppActive || !isComponentMounted.current) {
      console.warn('[Auth] Intento de cierre de sesión cuando la app está inactiva o componente desmontado');
      throw new Error('La aplicación está en segundo plano. Por favor, recarga la página');
    }
    
    // Si hay otra operación de autenticación en curso, bloquear
    if (isAuthOperationInProgress) {
      console.warn('[Auth] Operación de autenticación ya en curso');
      throw new Error('Operación en curso. Por favor, espera un momento');
    }
    
    try {
      console.log('[Auth] Iniciando proceso de cierre de sesión');
      isAuthOperationInProgress = true;
      
      // Configurar timeout para evitar bloqueos permanentes
      authOperationTimeout = setTimeout(() => {
        console.error('[Auth] Timeout en operación de cierre de sesión');
        resetAuthOperationState();
      }, AUTH_OPERATION_TIMEOUT);
      
      setIsLoading(true);
      
      // Limpiar el estado de la sesión inmediatamente para evitar navegaciones no deseadas
      setUser(null);
      setSession(null);
      
      // Utilizar el hook de logout que maneja la limpieza de localStorage y la redirección
      await performLogout();
      
      // Limpiar todos los recursos después del logout
      cleanupResources();
      
    } catch (error) {
      console.error('[Auth] Error durante cierre de sesión:', error);
      // En caso de error, intentar redirigir manualmente
      router.push('/login');
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
      }
      resetAuthOperationState();
    }
  };

  // Agregar una función para limpiar manualmente los recursos si es necesario
  const cleanup = useCallback(() => {
    cleanupResources();
  }, []);

  return { 
    user, 
    session, 
    signIn, 
    signUp, 
    signOut,
    cleanup, // Exponer la función de limpieza
    isLoading 
  };
}; 