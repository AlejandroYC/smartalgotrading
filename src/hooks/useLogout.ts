import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Hook personalizado para manejar el proceso de logout y limpieza de datos
 * Este hook se encarga de:
 * 1. Limpiar todos los datos de la aplicación en localStorage
 * 2. Cerrar la sesión en Supabase
 * 3. Redirigir al usuario a la página de login
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
    
  };

  /**
   * Función para realizar el logout completo
   */
  const logout = async () => {
    try {
      
      // Limpiar localStorage primero
      clearLocalStorage();
      
      // Intentar hacer logout en Supabase, pero no esperar por su resultado
      supabase.auth.signOut().catch(e => {
      });
      
      // Redirigir inmediatamente sin esperar respuesta
      router.push('/login');
      
    } catch (error) {
    }
  };

  return { logout, clearLocalStorage };
}; 