'use client';
import React from 'react';

export type LoadingSpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger';
  fullPage?: boolean;
  text?: string;
  className?: string;
};

/**
 * Componente de carga elegante y reutilizable.
 * 
 * @param size - Tamaño del spinner: xs, sm, md, lg, xl
 * @param variant - Variante de color: default, primary, secondary, success, danger
 * @param fullPage - Si es true, el spinner ocupa toda la página con un fondo semitransparente
 * @param text - Texto opcional para mostrar debajo del spinner
 * @param className - Clases adicionales para el contenedor
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  fullPage = false,
  text,
  className = '',
}) => {
  // Mapeo de tamaños a clases de Tailwind
  const sizeClasses = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  // Mapeo de variantes a clases de color
  const variantClasses = {
    default: 'border-gray-300 border-t-gray-600',
    primary: 'border-indigo-200 border-t-indigo-600',
    secondary: 'border-purple-200 border-t-purple-600',
    success: 'border-green-200 border-t-green-600',
    danger: 'border-red-200 border-t-red-600',
  };

  // Construir clases para el spinner
  const spinnerClasses = `animate-spin rounded-full ${sizeClasses[size]} ${variantClasses[variant]}`;

  // Contenedor a pantalla completa si fullPage es true
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-3">
          <div className={spinnerClasses}></div>
          {text && <p className="text-gray-700 font-medium mt-2">{text}</p>}
        </div>
      </div>
    );
  }

  // Spinner normal
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={spinnerClasses}></div>
      {text && <p className="text-gray-700 font-medium mt-2">{text}</p>}
    </div>
  );
};

/**
 * Versión del spinner que ocupa toda la pantalla con un mensaje personalizado
 */
export const FullPageLoading: React.FC<{
  message?: string;
  variant?: LoadingSpinnerProps['variant'];
}> = ({ message = 'Cargando datos...', variant = 'primary' }) => {
  return (
    <LoadingSpinner
      size="lg"
      variant={variant}
      fullPage={true}
      text={message}
    />
  );
};

/**
 * Versión del spinner que muestra un mensaje de "Procesando datos"
 */
export const DataLoadingSpinner: React.FC<{
  size?: LoadingSpinnerProps['size'];
  className?: string;
}> = ({ size = 'md', className }) => {
  return (
    <LoadingSpinner
      size={size}
      variant="primary"
      text="Procesando datos"
      className={className}
    />
  );
};

/**
 * Versión del spinner para usar en botones
 */
export const ButtonSpinner: React.FC<{
  size?: LoadingSpinnerProps['size'];
  className?: string;
}> = ({ size = 'xs', className = '' }) => {
  return (
    <div className={`inline-block ${className}`}>
      <LoadingSpinner size={size} variant="default" />
    </div>
  );
};

export default LoadingSpinner; 