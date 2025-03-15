'use client';
import React from 'react';

export type LoadingIndicatorProps = {
  type?: 'spinner' | 'dots' | 'pulse' | 'bar' | 'wave';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  fullScreen?: boolean;
  message?: string;
  overlay?: boolean;
  className?: string;
};

/**
 * Componente de carga elegante y reutilizable con múltiples variantes visuales.
 * 
 * @param type - Tipo de animación: spinner, dots, pulse, bar, wave
 * @param size - Tamaño del indicador: xs, sm, md, lg, xl
 * @param color - Color del indicador: primary, secondary, success, danger, warning, info
 * @param fullScreen - Si debe mostrarse a pantalla completa
 * @param message - Mensaje opcional a mostrar
 * @param overlay - Si debe mostrar un fondo semitransparente
 * @param className - Clases adicionales para personalización
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  fullScreen = false,
  message = '',
  overlay = true,
  className = '',
}) => {
  // Mapeo de colores a clases Tailwind
  const colorMap = {
    primary: {
      bg: 'bg-indigo-600',
      text: 'text-indigo-600',
      border: 'border-indigo-600',
      borderLight: 'border-indigo-300',
      fill: 'fill-indigo-600',
    },
    secondary: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-600',
      borderLight: 'border-purple-300',
      fill: 'fill-purple-600',
    },
    success: {
      bg: 'bg-green-600',
      text: 'text-green-600',
      border: 'border-green-600',
      borderLight: 'border-green-300',
      fill: 'fill-green-600',
    },
    danger: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-600',
      borderLight: 'border-red-300',
      fill: 'fill-red-600',
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-500',
      borderLight: 'border-amber-300',
      fill: 'fill-amber-500',
    },
    info: {
      bg: 'bg-blue-500',
      text: 'text-blue-500',
      border: 'border-blue-500',
      borderLight: 'border-blue-300',
      fill: 'fill-blue-500',
    },
  };

  // Mapeo de tamaños a clases
  const sizeMap = {
    xs: {
      container: 'h-4 w-4',
      dot: 'h-1 w-1',
      border: 'border-2',
      text: 'text-xs',
      barWidth: 'w-16',
      barHeight: 'h-1',
    },
    sm: {
      container: 'h-6 w-6',
      dot: 'h-1.5 w-1.5',
      border: 'border-2',
      text: 'text-sm',
      barWidth: 'w-24',
      barHeight: 'h-1.5',
    },
    md: {
      container: 'h-10 w-10',
      dot: 'h-2 w-2',
      border: 'border-2',
      text: 'text-base',
      barWidth: 'w-32',
      barHeight: 'h-2',
    },
    lg: {
      container: 'h-14 w-14',
      dot: 'h-3 w-3',
      border: 'border-3',
      text: 'text-lg',
      barWidth: 'w-48',
      barHeight: 'h-2.5',
    },
    xl: {
      container: 'h-20 w-20',
      dot: 'h-4 w-4',
      border: 'border-4',
      text: 'text-xl',
      barWidth: 'w-56',
      barHeight: 'h-3',
    },
  };

  // Renderizar el tipo de indicador seleccionado
  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div 
            className={`
              ${sizeMap[size].container}
              ${sizeMap[size].border}
              rounded-full
              border-t-transparent
              border-l-transparent
              ${colorMap[color].border}
              animate-spin
            `}
          />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`
                  ${sizeMap[size].dot}
                  rounded-full
                  ${colorMap[color].bg}
                  animate-bounce
                `}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '0.7s',
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div 
            className={`
              ${sizeMap[size].container}
              ${colorMap[color].bg}
              rounded-full
              animate-ping
              opacity-75
            `}
          />
        );
      
      case 'bar':
        return (
          <div className={`${sizeMap[size].barWidth} ${sizeMap[size].barHeight} bg-gray-200 rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${colorMap[color].bg} animate-loadingBar`}
              style={{
                animation: 'loadingBar 1.5s ease-in-out infinite',
              }}
            />
          </div>
        );
      
      case 'wave':
        return (
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${sizeMap[size].barHeight} w-1 ${colorMap[color].bg} rounded`}
                style={{
                  animation: 'wave 1s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                  height: `${(i === 0 || i === 4) ? '30%' : (i === 1 || i === 3) ? '70%' : '100%'}`,
                }}
              />
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Componente principal
  const loaderContent = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderLoader()}
      {message && (
        <p className={`mt-3 ${sizeMap[size].text} ${colorMap[color].text} font-medium`}>
          {message}
        </p>
      )}
    </div>
  );

  // Si es pantalla completa
  if (fullScreen) {
    return (
      <div 
        className={`
          fixed inset-0 z-50 flex items-center justify-center
          ${overlay ? 'bg-white/80 backdrop-blur-sm' : ''}
        `}
      >
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

/**
 * Versión para pantalla completa con mensaje predeterminado y diseño mejorado
 */
export const FullScreenLoading: React.FC<{
  message?: string;
  description?: string;
  color?: LoadingIndicatorProps['color'];
  type?: LoadingIndicatorProps['type'];
}> = ({ 
  message = 'Cargando datos...',
  description,
  color = 'primary',
  type = 'wave' 
}) => {
  // Mapeo de colores a clases de gradiente
  const gradientMap = {
    primary: 'from-indigo-600/90 to-purple-600/90',
    secondary: 'from-purple-600/90 to-pink-600/90',
    success: 'from-green-600/90 to-emerald-600/90',
    danger: 'from-red-600/90 to-orange-600/90',
    warning: 'from-amber-500/90 to-yellow-500/90',
    info: 'from-blue-600/90 to-sky-500/90',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientMap[color]} backdrop-blur-md opacity-90`}></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center text-white max-w-md mx-auto p-8">
        <div className="mb-6">
          <LoadingIndicator
            type={type}
            color="secondary"
            size="xl"
          />
        </div>
        
        {message && (
          <h3 className="text-2xl font-bold text-white text-center mb-2">
            {message}
          </h3>
        )}
        
        {description && (
          <p className="text-white/90 text-center mb-4">
            {description}
          </p>
        )}
        
        <div className="flex justify-center mt-3">
          <span className="inline-block">
            <span className="h-2 w-2 bg-white rounded-full inline-block animation-delay-100 animate-pulse"></span>
            <span className="h-2 w-2 bg-white rounded-full inline-block ml-1 animation-delay-200 animate-pulse"></span>
            <span className="h-2 w-2 bg-white rounded-full inline-block ml-1 animation-delay-300 animate-pulse"></span>
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Versión para elementos de contenido
 */
export const ContentLoading: React.FC<{
  message?: string;
  type?: LoadingIndicatorProps['type'];
  size?: LoadingIndicatorProps['size'];
  color?: LoadingIndicatorProps['color'];
  className?: string;
}> = ({
  message = 'Cargando...',
  type = 'spinner',
  size = 'md',
  color = 'primary',
  className = '',
}) => (
  <div className={`w-full py-8 flex items-center justify-center ${className}`}>
    <LoadingIndicator
      type={type}
      color={color}
      size={size}
      message={message}
    />
  </div>
);

/**
 * Versión para usar en botones
 */
export const ButtonLoading: React.FC<{
  color?: LoadingIndicatorProps['color'];
  className?: string;
}> = ({ color = 'primary', className = 'mr-2' }) => (
  <LoadingIndicator
    type="spinner"
    color={color}
    size="xs"
    className={className}
  />
);

// Añadir animaciones al CSS global
const addAnimationStyles = () => {
  if (typeof window === 'undefined') return null;
  
  // Crear elemento style si no existe
  if (!document.getElementById('loading-indicator-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-indicator-styles';
    style.innerHTML = `
      @keyframes loadingBar {
        0% { width: 0%; }
        50% { width: 100%; }
        100% { width: 0%; }
      }
      @keyframes wave {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1); }
      }
    `;
    document.head.appendChild(style);
  }
  
  return null;
};

// Componente para insertar animaciones
export const LoadingStyles: React.FC = () => {
  React.useEffect(() => {
    addAnimationStyles();
  }, []);
  
  return null;
};

export default LoadingIndicator; 