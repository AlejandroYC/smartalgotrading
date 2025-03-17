import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorCount: number;
  lastError: Error | null;
  lastRetryTime: number;
}

/**
 * Componente ErrorBoundary para envolver gráficos de Recharts
 * y evitar que sus errores causen bucles infinitos o detengan la aplicación
 */
class ChartErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorCount: 0,
    lastError: null,
    lastRetryTime: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar el estado para que el siguiente renderizado muestre la UI alternativa
    return { hasError: true, lastError: error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error en componente de gráficos:', error);
    console.error('Información adicional:', errorInfo);
    
    const now = Date.now();
    const timeSinceLastRetry = now - this.state.lastRetryTime;
    
    // Detectar posibles ciclos de error (más de 3 errores en menos de 2 segundos)
    const isPossibleInfiniteLoop = timeSinceLastRetry < 2000 && this.state.errorCount >= 2;
    
    // Incrementar contador de errores
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1,
      lastRetryTime: now
    }));
    
    // Prevenir bucles infinitos deteniendo la propagación del error
    if (isPossibleInfiniteLoop) {
      // Forzar una espera para romper el ciclo
      console.warn('Posible bucle infinito detectado, esperando para romper el ciclo');
    }
  }

  public render() {
    if (this.state.hasError) {
      // Si hay demasiados errores, mostrar mensaje permanente
      if (this.state.errorCount >= 3) {
        return (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Error al renderizar el gráfico</p>
              <p className="text-xs text-gray-400 mt-1">
                Demasiados intentos fallidos. Por favor, recargue la página.
              </p>
            </div>
          </div>
        );
      }
      
      // UI alternativa
      return this.props.fallback || (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-1">Error al renderizar el gráfico</p>
            <button 
              onClick={() => {
                // Esperar un momento antes de reintentar para romper posibles ciclos
                setTimeout(() => {
                  this.setState({ 
                    hasError: false,
                    lastRetryTime: Date.now()
                  });
                }, 500);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary; 