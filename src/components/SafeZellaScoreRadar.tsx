import React from 'react';
import ZellaScoreRadar from './ZellaScoreRadar';

// Wrapper para hacer seguro el componente ZellaScoreRadar
export const SafeZellaScoreRadar = ({ metrics }: { metrics: any[] }) => {
  // Asegurarse de que todas las métricas tienen valores válidos
  const safeMetrics = metrics.map(metric => ({
    name: metric.name || '',
    value: typeof metric.value === 'number' ? metric.value : 0,
    description: metric.description || ''
  }));
  
  try {
    return <ZellaScoreRadar metrics={safeMetrics} />;
  } catch (error) {
    console.error("Error renderizando ZellaScoreRadar:", error);
    return (
      <div className="py-8 text-center text-gray-500">
        <p>Error al mostrar el gráfico de radar</p>
      </div>
    );
  }
}; 