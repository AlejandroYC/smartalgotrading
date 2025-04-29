import React, { useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

interface NetDailyPLProps {
  dailyResults: Record<string, DailyResult>;
  height?: number;
}

const NetDailyPL: React.FC<NetDailyPLProps> = ({ 
  dailyResults,
  height = 300 
}) => {
  // Calcular el total del P&L para verificación
  const totalPL = useMemo(() => {
    // Usar el método centralizado que accede directamente a la misma fuente que el calendario
    if (typeof (dailyResults as any).calculateTotalPL === 'function') {
      const calculatedPL = (dailyResults as any).calculateTotalPL();
      return calculatedPL;
    }
    
    // Si no está disponible, sumar directamente de los daily_results sin modificaciones
    const total = Object.values(dailyResults).reduce((sum, day) => {
      // Asegurarnos de que estamos sumando números, no strings
      const profit = typeof day.profit === 'string' ? parseFloat(day.profit) : day.profit;
      return sum + profit;
    }, 0);
    
    return total;
  }, [dailyResults]);

  // Añadimos un efecto para hacer logging de la información
  useEffect(() => {
    // Solo ejecutar en modo desarrollo
    if (process.env.NODE_ENV !== 'development') return;    
    if (typeof (dailyResults as any).verifyDailyResultsConsistency === 'function') {
      const consistency = (dailyResults as any).verifyDailyResultsConsistency();
    }
    
  }, [dailyResults]);

  const data = useMemo(() => {
    if (!dailyResults) return [];
    
    // Ordenar fechas cronológicamente
    const sortedDates = Object.keys(dailyResults).sort();
    
    // Mapear a formato para el gráfico y eliminar días sin trades
    return sortedDates
      .map(date => {
        const result = dailyResults[date];
        if (!result || result.trades === 0) return null;
        
        return {
          date,
          profit: result.profit || 0,
          trades: result.trades || 0
        };
      })
      .filter(Boolean) as Array<{date: string, profit: number, trades: number}>; // Eliminar entradas nulas y tipar explícitamente
  }, [dailyResults]);
  
  // Reducir la cantidad de ticks en el eje X si hay muchos datos
  const xAxisTicks = useMemo(() => {
    if (data.length <= 8) return undefined; // Usar todos los ticks si hay pocos datos
    
    // Tomar puntos distribuidos uniformemente
    const step = Math.ceil(data.length / 7); // ~7 ticks
    
    const ticks: string[] = [];
    for (let i = 0; i < data.length; i += step) {
      ticks.push(data[i].date);
    }
    
    // Asegurar que el último punto está incluido
    if (data.length > 0 && !ticks.includes(data[data.length - 1].date)) {
      ticks.push(data[data.length - 1].date);
    }
    
    return ticks;
  }, [data]);

  // Generar ticks para el eje Y en incrementos regulares
  const yAxisTicks = useMemo(() => {
    if (data.length === 0) return [0];
    
    const maxProfit = Math.max(...data.map(d => d.profit), 0);
    const minProfit = Math.min(...data.map(d => d.profit), 0);
    
    // Determinar el rango total
    const absMax = Math.max(Math.abs(maxProfit), Math.abs(minProfit));
    
    // Calcular el valor del incremento con base en los datos reales
    // Usar un incremento más pequeño para rangos pequeños
    let increment = 5;
    if (absMax > 20) increment = 10;
    
    // Crear un array de ticks desde 0 hacia abajo/arriba
    const ticks = [0];
    
    // Si tenemos valores negativos, agregar ticks negativos
    if (minProfit < 0) {
      let currentTick = -increment;
      // Limitar los ticks al mínimo valor real + pequeño margen
      const minLimit = Math.floor(minProfit / increment) * increment;
      while (currentTick >= minLimit && ticks.length < 15) {
        ticks.push(currentTick);
        currentTick -= increment;
      }
    }
    
    // Si tenemos valores positivos, agregar ticks positivos
    if (maxProfit > 0) {
      let currentTick = increment;
      // Limitar los ticks al máximo valor real + pequeño margen
      const maxLimit = Math.ceil(maxProfit / increment) * increment;
      while (currentTick <= maxLimit && ticks.length < 15) {
        ticks.push(currentTick);
        currentTick += increment;
      }
    }
    
    return ticks.sort((a, b) => a - b);
  }, [data]);

  // Si no hay datos, mostrar un mensaje
  if (!data.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">P&L Diario</h3>
        <div className="flex items-center justify-center h-56 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const maxProfit = Math.max(...data.map(d => d.profit));
  const minProfit = Math.min(...data.map(d => d.profit));
  const absMax = Math.max(Math.abs(maxProfit), Math.abs(minProfit));

  // Función para renderizar barras personalizadas con color completo hasta el eje
  const CustomBar = (props: any) => {
    const { x, y, width, height, fill, value, index } = props;
    
    // El color depende de si el valor es positivo o negativo
    const color = value >= 0 ? '#22c55e' : '#ef4444';
    
    // Redondear solo las esquinas superiores
    const radius = 4;
    
    // Calcular la posición Y para barras negativas
    // Para valores negativos, la barra debe ir desde el 0 hacia abajo
    const barHeight = Math.abs(height);
    
    // Devolver un rectángulo con las propiedades calculadas
    return (
      <g>
        <rect
          x={x}
          y={value >= 0 ? y : y - barHeight} // Ajustar para barras negativas
          width={width}
          height={barHeight}
          fill={color}
          rx={radius}
          ry={radius}
        />
      </g>
    );
  };

  return (
    <div className="bg-white p-[16px] rounded-lg shadow h-full flex flex-col">
      <div className="flex items-start justify-start mb-4">
        <h1 className="text-[16px] font-semibold text-black font-roboto text-left">P&L neto diario</h1>
      </div>
      <hr className="w-full border-t border-gray-200 mb-4 mt-6" />

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            barGap={2}
            barCategoryGap={data.length <= 3 ? 120 : data.length <= 5 ? 80 : 8}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#E2E8F0"
            />
            <XAxis
              dataKey="date"
              ticks={xAxisTicks}
              tickFormatter={(date) => {
                if (!date) return '';
                const parts = date.split('-');
                if (parts.length !== 3) return date;
                // Formato MM/DD estilo imagen
                return `${parts[1]}/${parts[2]}`;
              }}
              stroke="#94A3B8"
              fontSize={12}
            />
            <YAxis 
              ticks={yAxisTicks}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              stroke="#94A3B8"
              fontSize={12}
              width={70}
              domain={[
                // Ajustar el dominio para solo tener un pequeño margen
                minProfit < 0 ? Math.floor(minProfit * 1.1) : -1, 
                maxProfit > 0 ? Math.ceil(maxProfit * 1.1) : 1
              ]}
            />
            <Tooltip
              formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, undefined]}
              labelFormatter={(date) => format(parseISO(date as string), 'MMM dd, yyyy')}
              contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{
                color: '#E2E8F0'
              }}
              labelStyle={{
                color: '#F8FAFC',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}
            />
            <Bar
              dataKey="profit"
              barSize={data.length <= 3 ? 30 : data.length <= 5 ? 40 : 20}
              shape={<CustomBar />}
              isAnimationActive={false}
            />
            <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(NetDailyPL);