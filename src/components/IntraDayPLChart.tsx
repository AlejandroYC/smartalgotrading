import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

interface IntraDayTrade {
  time: string | number;
  ticket: number;
  profit: number;
  symbol?: string;
  type?: string;
}

interface IntraDayPLChartProps {
  trades: IntraDayTrade[];
  totalProfit: number;
}

const IntraDayPLChart: React.FC<IntraDayPLChartProps> = ({ trades, totalProfit }) => {
  // Ordenar los trades por tiempo
  const sortedTrades = [...trades].sort((a, b) => {
    // Convertir time a Date si es necesario
    const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : 
                  (a.time > 10000000000 ? a.time : a.time * 1000);
    const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : 
                  (b.time > 10000000000 ? b.time : b.time * 1000);
    return timeA - timeB;
  });

  // Preparar datos para el gráfico - acumular P&L
  const chartData = sortedTrades.reduce((acc: any[], trade, index) => {
    // Convertir time a objeto Date
    const tradeTime = typeof trade.time === 'string' ? new Date(trade.time) : 
                      new Date(trade.time > 10000000000 ? trade.time : trade.time * 1000);
    
    // Formatear hora para visualización
    const timeStr = format(tradeTime, 'HH:mm:ss');
    
    // Calcular P&L acumulado
    const prevValue = index > 0 ? acc[index - 1].value : 0;
    const profit = parseFloat(String(trade.profit || 0));
    const value = prevValue + profit;
    
    // Separar valores positivos y negativos para el gráfico
    acc.push({
      time: timeStr,
      value,
      positiveValue: value >= 0 ? value : 0,
      negativeValue: value < 0 ? value : undefined,
      rawTime: tradeTime
    });
    
    return acc;
  }, []);

  // Si no hay suficientes datos, agregar puntos al principio y al final
  if (chartData.length === 0) {
    // Agregar punto inicial en 0
    chartData.push({
      time: '00:00',
      value: 0,
      positiveValue: 0,
      negativeValue: undefined,
      rawTime: new Date()
    });
    
    // Agregar punto final con el total de P&L
    chartData.push({
      time: '23:59',
      value: totalProfit,
      positiveValue: totalProfit >= 0 ? totalProfit : 0,
      negativeValue: totalProfit < 0 ? totalProfit : undefined,
      rawTime: new Date()
    });
  } else if (chartData.length === 1) {
    // Si solo hay un punto, agregar uno al principio con valor 0
    const firstPoint = {
      time: format(new Date(chartData[0].rawTime.getTime() - 3600000), 'HH:mm:ss'),
      value: 0,
      positiveValue: 0,
      negativeValue: undefined,
      rawTime: new Date(chartData[0].rawTime.getTime() - 3600000)
    };
    chartData.unshift(firstPoint);
  }

  // Procesar los datos para asegurar continuidad en las áreas
  for (let i = 1; i < chartData.length; i++) {
    const currentPoint = chartData[i];
    const prevPoint = chartData[i-1];
    
    // Si cruzamos de positivo a negativo o viceversa, necesitamos un punto de cruce en cero
    if ((prevPoint.value >= 0 && currentPoint.value < 0) || 
        (prevPoint.value < 0 && currentPoint.value >= 0)) {
      
      // Calcular el tiempo proporcional donde ocurre el cruce por cero
      const prevTime = prevPoint.rawTime.getTime();
      const currentTime = currentPoint.rawTime.getTime();
      const prevValue = prevPoint.value;
      const currentValue = currentPoint.value;
      
      // Evitar división por cero
      if (currentValue !== prevValue) {
        const zeroRatio = Math.abs(prevValue) / Math.abs(currentValue - prevValue);
        const zeroCrossingTime = new Date(prevTime + zeroRatio * (currentTime - prevTime));
        
        // Insertar un punto exactamente en cero
        const zeroPoint = {
          time: format(zeroCrossingTime, 'HH:mm:ss'),
          value: 0,
          positiveValue: 0,
          negativeValue: 0,
          rawTime: zeroCrossingTime
        };
        
        // Insertar el punto de cruce justo antes del punto actual
        chartData.splice(i, 0, zeroPoint);
        i++; // Incrementar i ya que hemos agregado un nuevo punto
      }
    }
  }

  // Formateador para el eje Y
  const formatYAxis = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].payload.value; // Usar el valor original
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="text-sm font-medium">{`Time: ${label}`}</p>
          <p className="text-sm font-medium">
            <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
              P&L: ${value.toFixed(2)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Determinar los rangos mínimos y máximos para el eje Y
  const minValue = Math.min(...chartData.map(item => item.value));
  const maxValue = Math.max(...chartData.map(item => item.value));
  
  // Agregar un margen para que el gráfico no quede pegado a los límites
  const yAxisDomain = [
    Math.min(0, minValue * 1.1), // Asegurar que 0 siempre esté incluido
    Math.max(0, maxValue * 1.1)  // Asegurar que 0 siempre esté incluido
  ];

  return (
  <div className="h-60 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <defs>
          <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#4ade80" stopOpacity={0.2} />
          </linearGradient>
          
          <linearGradient id="negativeGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f87171" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#f87171" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
        <YAxis 
          tickFormatter={value => `$${value.toFixed(2)}`} 
          axisLine={false} 
          tickLine={false}
          domain={yAxisDomain}
          tick={{ fontSize: 10 }}
          width={60} // Aumentamos el ancho para acomodar números más grandes
          padding={{ top: 10, bottom: 10 }}
        />
        <Tooltip content={<CustomTooltip />} />
        
        <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
        
        <Area 
          type="monotone" 
          dataKey="positiveValue" 
          stroke="#4ade80"
          fill="url(#positiveGradient)" 
          fillOpacity={1}
          activeDot={{ r: 6, fill: "#4ade80", strokeWidth: 0 }}
          isAnimationActive={true}
          animationDuration={600}
          animationEasing="ease-out"
          connectNulls={true}
        />
        
        <Area 
          type="monotone" 
          dataKey="negativeValue" 
          stroke="#f87171"
          fill="url(#negativeGradient)" 
          fillOpacity={1}
          activeDot={{ r: 6, fill: "#f87171", strokeWidth: 0 }}
          isAnimationActive={true}
          animationDuration={600}
          animationEasing="ease-out"
          connectNulls={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
};

export default IntraDayPLChart; 