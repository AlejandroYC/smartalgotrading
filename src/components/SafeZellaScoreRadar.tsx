'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Importar ZellaScoreRadar dinámicamente con SSR desactivado
const ZellaScoreRadar = dynamic(() => import('./ZellaScoreRadar'), { ssr: false });

interface SafeZellaScoreRadarProps {
  className?: string;
}

// Wrapper para hacer seguro el componente ZellaScoreRadar
export const SafeZellaScoreRadar: React.FC<SafeZellaScoreRadarProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Solo renderizar en el cliente
  if (!isMounted) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-semibold text-gray-800">Puntuación LMC</h3>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  try {
    return <ZellaScoreRadar className={className} />;
  } catch (error) {
    console.error("Error renderizando ZellaScoreRadar:", error);
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 py-8 text-center text-gray-500 ${className}`}>
        <p>Error al mostrar el gráfico de radar</p>
      </div>
    );
  }
}; 