import React, { useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import DashboardCardTitle from '@/components/DashboardCardTitle';

interface DailyResult {
  profit: number;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
  net_profit?: number;
  swap?: number;
}

interface DailyNetCumulativePLProps {
  dailyResults: Record<string, DailyResult>;
  height?: number;
}

const DailyNetCumulativePL: React.FC<DailyNetCumulativePLProps> = ({ 
  dailyResults,
  height = 300 
}) => {
  const chartData = useMemo(() => {
    if (!dailyResults || Object.keys(dailyResults).length === 0) {
      return [];
    }

    // IMPORTANTE: Para evitar problemas de redondeo, mantenemos la precisión completa durante los cálculos
    // y sólo redondeamos al final para la visualización
    let cumulativeProfit = 0;
    
    // Log de diagnóstico para verificar si daily_results contiene swap
    console.log('DAILY RESULTS SWAP CHECK:', {
      tieneSwap: Object.values(dailyResults).some(day => day.swap !== undefined),
      tieneNetProfit: Object.values(dailyResults).some(day => day.net_profit !== undefined),
      ejemploDia: Object.entries(dailyResults)[0]?.[1]
    });
    
    // Solo utilizar los resultados diarios directamente
    // Ordenados por fecha para calcular el acumulado correctamente
    return Object.entries(dailyResults)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => {
        // Usamos net_profit (que incluye swap) si está disponible, sino calculamos profit+swap, o caemos a profit
        // Esta lógica asegura compatibilidad tanto con el nuevo formato que incluye swap como con el antiguo
        const dailyNetProfit = data.net_profit !== undefined 
          ? (typeof data.net_profit === 'string' ? parseFloat(data.net_profit) : data.net_profit)
          : (data.swap !== undefined 
              ? (typeof data.profit === 'string' ? parseFloat(data.profit) : data.profit) + 
                (typeof data.swap === 'string' ? parseFloat(data.swap) : (data.swap || 0))
              : (typeof data.profit === 'string' ? parseFloat(data.profit) : data.profit));
        
        // Guardo también el valor original de profit para mostrar desglose
        const dailyProfit = typeof data.profit === 'string' ? parseFloat(data.profit) : data.profit;
        // Guardo el valor del swap
        const dailySwap = data.swap !== undefined 
          ? (typeof data.swap === 'string' ? parseFloat(data.swap) : data.swap) 
          : 0;
        
        // Acumular sin redondeo usando el net profit (con swap)
        cumulativeProfit += dailyNetProfit;
        
        // Sólo redondear para visualización
        return {
          date,
          value: cumulativeProfit,
          valueDisplay: Number(cumulativeProfit.toFixed(2)),
          dailyNetProfit,
          dailyNetProfitDisplay: Number(dailyNetProfit.toFixed(2)),
          dailyProfit,
          dailyProfitDisplay: Number(dailyProfit.toFixed(2)),
          dailySwap,
          dailySwapDisplay: Number(dailySwap.toFixed(2)),
          trades: data.trades,
        };
      });
  }, [dailyResults]);

  // Log de diagnóstico solo en modo desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // Verificar si tenemos el método centralizado
    if (typeof (dailyResults as any).calculateTotalPL === 'function') {
      const centralTotal = (dailyResults as any).calculateTotalPL();
    }
    
    // Total calculado por el gráfico (último valor acumulado)
    if (chartData.length > 0) {
      const graphTotal = chartData[chartData.length - 1].value;
      
      // Calcular suma directa de daily_results considerando tanto profit como swap
      const manualTotal = Object.values(dailyResults).reduce((sum: number, day: any) => {
        const dayProfit = typeof day.profit === 'string' ? parseFloat(day.profit) : day.profit;
        const daySwap = day.swap !== undefined ? 
          (typeof day.swap === 'string' ? parseFloat(day.swap) : day.swap) : 0;
        const dayNetProfit = day.net_profit !== undefined ? 
          (typeof day.net_profit === 'string' ? parseFloat(day.net_profit) : day.net_profit) : 
          (dayProfit + daySwap);
          
        return sum + dayNetProfit;
      }, 0);
      
      // Log con detalles para verificar la consistencia
      console.log('VERIFICACIÓN CONSISTENCIA GRÁFICO (con swap):', {
        acumulado_grafico: graphTotal.toFixed(2),
        suma_manual_net_profit: manualTotal.toFixed(2),
        diferencia: (graphTotal - manualTotal).toFixed(4),
        consistente: Math.abs(graphTotal - manualTotal) < 0.01
      });
    }
    
  }, [dailyResults, chartData]);

  // Reducir la cantidad de ticks en el eje X
  const xAxisTicks = useMemo(() => {
    if (chartData.length <= 10) return undefined; // Usar todos los ticks si hay pocos datos
    
    // Tomar puntos distribuidos uniformemente
    const numTicks = Math.min(8, chartData.length); // Máximo 8 ticks
    const step = Math.ceil(chartData.length / numTicks);
    
    const ticks = [];
    for (let i = 0; i < chartData.length; i += step) {
      if (chartData[i]) {
        ticks.push(chartData[i].date);
      }
    }
    
    // Asegurar que el último punto está incluido
    if (chartData.length > 0 && !ticks.includes(chartData[chartData.length - 1].date)) {
      ticks.push(chartData[chartData.length - 1].date);
    }
    
    return ticks;
  }, [chartData]);

  // Generar ticks para el eje Y en incrementos regulares
  const yAxisTicks = useMemo(() => {
    if (chartData.length === 0) return [0];
    
    const maxValue = Math.max(...chartData.map(d => d.value), 0);
    const minValue = Math.min(...chartData.map(d => d.value), 0);
    
    // Determinar el rango total
    const absoluteMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
    
    // Calcular el valor del incremento (usando $20 como en la imagen)
    const increment = 20;
    
    // Crear un array de ticks desde 0 hacia abajo/arriba
    const ticks = [0];
    
    // Si tenemos valores negativos, agregar ticks negativos
    if (minValue < 0) {
      let currentTick = -increment;
      while (currentTick >= minValue && ticks.length < 12) { // Limitar a 12 ticks para evitar sobrecarga
        ticks.push(currentTick);
        currentTick -= increment;
      }
      
      // Asegurar que el valor mínimo esté incluido
      if (!ticks.includes(minValue) && ticks.length < 12) {
        ticks.push(Math.floor(minValue / increment) * increment);
      }
    }
    
    // Si tenemos valores positivos, agregar ticks positivos
    if (maxValue > 0) {
      let currentTick = increment;
      while (currentTick <= maxValue && ticks.length < 12) {
        ticks.push(currentTick);
        currentTick += increment;
      }
      
      // Asegurar que el valor máximo esté incluido
      if (!ticks.includes(maxValue) && ticks.length < 12) {
        ticks.push(Math.ceil(maxValue / increment) * increment);
      }
    }
    
    return ticks.sort((a, b) => a - b);
  }, [chartData]);

  // Determinar si hay inconsistencia (cambios entre positivo y negativo)
  const isInconsistent = useMemo(() => {
    if (chartData.length < 2) return false;
    
    let hasPositive = false;
    let hasNegative = false;
    
    for (const item of chartData) {
      if (item.value > 0) hasPositive = true;
      if (item.value < 0) hasNegative = true;
      if (hasPositive && hasNegative) return true;
    }
    
    return false;
  }, [chartData]);
  
  // Determinar el color final basado en el último valor
  const finalValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const lineColor = "#8778dd"; // Color púrpura para la línea como en la imagen
  const chartMainColor = finalValue >= 0 ? "#22c55e" : "#ef4444";

  // Agregar log de diagnóstico para verificar los datos finales después de construir el gráfico
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || chartData.length === 0) return;
    
    // Verificar los datos del gráfico para diagnóstico
    console.log('DAILY NET CUMULATIVE PL DIAGNOSIS:', {
      chartDataLongitud: chartData.length,
      primerosDias: chartData.slice(0, 3),
      ultimosDias: chartData.slice(-3),
      diasConSwap: chartData.filter(day => day.dailySwap !== 0),
      acumuladoFinal: chartData[chartData.length - 1]?.value,
      totalNetProfitSuma: chartData.reduce((sum, day) => sum + day.dailyNetProfit, 0),
      totalProfitSuma: chartData.reduce((sum, day) => sum + day.dailyProfit, 0),
      totalSwapSuma: chartData.reduce((sum, day) => sum + day.dailySwap, 0),
    });
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow h-full">
        
        <div className="h-full flex flex-col justify-center items-center">
          <DashboardCardTitle 
            title="Daily Net Cumulative P&L"
            showInfo={true}
          />
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-600">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const absMax = Math.max(Math.abs(maxValue), Math.abs(minValue));

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 sm:px-6 py-4">
        <h1 className="text-[#2D3748] text-[16px] font-semibold">P&L neto acumulado diario</h1>
      </div>
      <hr className="w-full border-t border-gray-200" />
  
      {/* Chart */}
      <div className="flex-1 w-full min-h-[250px] h-[300px] sm:h-[400px] md:h-[450px] px-4 sm:px-6 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 0, left: -30, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#fecaca" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              ticks={xAxisTicks}
              tickFormatter={(date) => {
                const parts = date?.split('-');
                return parts?.length === 3 ? `${parts[1]}/${parts[2]}` : date;
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
              domain={['auto', 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip
              formatter={(value: any, name: string, props: any) => {
                if (name === 'value') {
                  return [`Net P&L: $${parseFloat(props.payload.valueDisplay).toFixed(2)}`, 'Cumulative P&L'];
                }
                return [`$${parseFloat(value).toFixed(2)}`, name];
              }}
              labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
              contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: '#E2E8F0' }}
              labelStyle={{ color: '#F8FAFC', fontWeight: 'bold', marginBottom: '5px' }}
              content={({ active, payload, label }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-800 p-3 rounded-lg shadow-lg text-white text-sm">
                      <p className="font-bold mb-2">{format(parseISO(label), 'MMM dd, yyyy')}</p>
                      <p>Net P&L: <span className="font-bold">${data.dailyNetProfitDisplay}</span></p>
                      {data.dailySwap !== 0 && (
                        <>
                          <p>Trade P&L: <span className="font-bold">${data.dailyProfitDisplay}</span></p>
                          <p>Swap: <span className="font-bold">${data.dailySwapDisplay}</span></p>
                        </>
                      )}
                      <p>Cumulative: <span className="font-bold">${data.valueDisplay}</span></p>
                      <p>Trades: <span className="font-bold">{data.trades}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={(data) => data.value >= 0 ? data.value : 0}
              stroke="#22c55e"
              fill="url(#positiveGradient)"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              connectNulls
            />
            <Area
              type="monotone"
              dataKey={(data) => data.value < 0 ? data.value : 0}
              stroke="#ef4444"
              fill="url(#negativeGradient)"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              connectNulls
            />
            <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
};

export default React.memo(DailyNetCumulativePL); 