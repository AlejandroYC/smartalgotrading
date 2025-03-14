import { useEffect, RefObject } from 'react';

/**
 * Hook que detecta clics fuera de un elemento especificado
 * @param ref - Referencia al elemento a monitorear
 * @param handler - Función a ejecutar cuando se detecta un clic fuera
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // No hacer nada si el clic ocurrió dentro del elemento
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      // Si el clic es fuera, ejecutar la función handler
      handler(event);
    };
    
    // Agregar event listeners para mouse y touch
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // Limpiar event listeners al desmontar el componente
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Re-ejecutar si ref o handler cambian
} 