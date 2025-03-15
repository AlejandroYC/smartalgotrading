import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Hook personalizado para manejar el proceso de logout y limpieza de datos
 * Este hook se encarga de:
 * 1. Limpiar todos los datos de la aplicación en localStorage
 * 2. Llamar a la API de logout del servidor para limpiar cookies
 * 3. Cerrar la sesión en Supabase cliente
 * 4. Redirigir al usuario a la página de login
 */
export const useLogout = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  /**
   * Función para limpiar todos los datos de la aplicación en localStorage
   */
  const clearLocalStorage = () => {
    if (typeof window === 'undefined') return;
    
    // Guardar una lista de las claves eliminadas para diagnóstico
    const removedKeys: string[] = [];
    
    try {
      // Limpiar todos los datos relacionados con la aplicación
      Object.keys(localStorage).forEach(key => {
        // Limpiar datos de Supabase
        if (key.startsWith('supabase.auth.') || key.includes('supabase')) {
          localStorage.removeItem(key);
          removedKeys.push(key);
        }
        
        // Limpiar datos específicos de la aplicación
        if (key.startsWith('smartalgo_')) {
          localStorage.removeItem(key);
          removedKeys.push(key);
        }
      });
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  };

  /**
   * Llamar a la API de logout del servidor para limpiar cookies
   */
  const callServerLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Importante para enviar cookies
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error en API de logout:", error);
      }
      
      return true;
    } catch (error) {
      console.error("Error al llamar a la API de logout:", error);
      return false;
    }
  };

  /**
   * Función para realizar el logout completo de manera secuencial
   */
  const logout = async () => {
    try {
      console.log('Iniciando proceso de logout');
      
      // 1. Primero llamar a la API del servidor para limpiar cookies
      await callServerLogout();
      console.log('Logout del servidor completado');
      
      // 2. Limpiar localStorage 
      clearLocalStorage();
      console.log('LocalStorage limpiado');
      
      // 3. Hacer logout en Supabase cliente y esperar que termine
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error en signOut de Supabase:', error);
      }
      console.log('Logout de Supabase completado');
      
      // 4. Pequeño delay para asegurar que los cambios se apliquen
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 5. Redirigir al login
      console.log('Redirigiendo a login');
      router.push('/login');
      
      // 6. Forzar un refresco de la página después de un breve delay
      // Esto garantiza que todos los estados se limpien correctamente
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
    } catch (error) {
      console.error('Error durante el proceso de logout:', error);
      // Si ocurre un error, intentar redirigir de todas formas
      router.push('/login');
    }
  };

  return { logout, clearLocalStorage };
}; 