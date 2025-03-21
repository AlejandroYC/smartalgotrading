import React, { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts';
import MiniPLChart from './MiniPLChart';
import { useTradingData } from '@/contexts/TradingDataContext';
// Alternate implementation using Chart.js
// import { Doughnut } from 'react-chartjs-2';
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// ChartJS.register(ArcElement, Tooltip, Legend);

interface StatCardProps {
  title: string;
  value: number | string;
  info?: string | boolean;
  prefix?: string;
  suffix?: string;
  wins?: number;
  losses?: number;
  draws?: number;
  winAmount?: number;
  lossAmount?: number;
  totalTrades?: number;
  showPurpleIndicator?: boolean;
  variant?: 'profit' | 'winrate' | 'profit-factor' | 'day-winrate' | 'avg-trade' | 'ratio' | 'factor';
  // resto de propiedades...
}

interface DailyResult {
  profit: number | string;
  trades: number;
  status: 'win' | 'loss' | 'break_even';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  info,
  prefix = "",
  suffix = "",
  wins = 0,
  losses = 0,
  draws = 0,
  winAmount = 0,
  lossAmount = 0,
  totalTrades = 0,
  showPurpleIndicator = false,
  variant = 'profit'
}) => {
  // Estado para controlar la visibilidad del tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const { processedData } = useTradingData();

  // Preparar datos para el mini gráfico de P&L
  const miniChartData = useMemo(() => {
    if (variant !== 'profit' || !processedData?.daily_results) return [];

    return Object.entries(processedData.daily_results as Record<string, DailyResult>)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .reduce((acc: Array<{ time: string; value: number }>, [date, data]) => {
        const profit = typeof data.profit === 'string' ? parseFloat(data.profit) : data.profit;
        const prevValue = acc.length > 0 ? acc[acc.length - 1].value : 0;

        acc.push({
          time: date,
          value: prevValue + profit
        });

        return acc;
      }, []);
  }, [variant, processedData?.daily_results]);

  // Calcular el porcentaje real de días ganadores (sin incluir breakeven en el denominador)
  const calculateDayWinRate = () => {
    const totalWithoutDraws = wins + losses;
    if (totalWithoutDraws === 0) return 0;
    return (wins / totalWithoutDraws) * 100;
  };

  // Calcular el porcentaje de winrate
  const calculateWinRate = () => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return (wins / total) * 100;
  };

  // Obtener el valor correcto según la variante
  const getCorrectValue = () => {
    if (variant === 'day-winrate') {
      return calculateDayWinRate();
    } else if (variant === 'winrate') {
      // Usar directamente el valor pasado por props para win rate
      return typeof value === 'number' ? value : parseFloat(String(value));
    }
    return typeof value === 'number' ? value : parseFloat(String(value));
  };

  // Obtener el texto de información según el tipo de tarjeta
  const getTooltipText = () => {
    switch (variant) {
      case 'profit':
        return "Beneficio neto: Muestra la ganancia o pérdida total de todas las operaciones en el período seleccionado.";
      case 'winrate':
        return "Porcentaje de éxito: Muestra el porcentaje de operaciones ganadoras sobre el total de operaciones.";
      case 'profit-factor':
        return "Factor de beneficio: Relación entre ganancias brutas y pérdidas brutas. Un valor mayor a 1 indica rentabilidad.";
      case 'day-winrate':
        return "Porcentaje de días ganadores: Refleja el porcentaje de días de trading ganadores sobre el total de días operados.";
      case 'avg-trade':
        return "Relación ganancia/pérdida promedio: Compara el tamaño promedio de operaciones ganadoras vs perdedoras.";
      default:
        return "Información detallada sobre esta estadística.";
    }
  };

  // Formatear el valor para mostrarlo correctamente
  const formatValue = () => {
    // Si es day-winrate, usamos el valor calculado correctamente
    const valueToUse = getCorrectValue();

    if (variant === 'profit') {
      // Formato para moneda: $3,874.96
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valueToUse);
    } else if (variant === 'profit-factor' || variant === 'avg-trade') {
      // Formatear correctamente para casos con valor "undefined" o "NaN"
      if (isNaN(valueToUse) || valueToUse === null || valueToUse === undefined) {
        return "--";
      }
      // Formato para valores con 2 decimales: 3.47, 2.00
      return valueToUse.toFixed(2);
    } else {
      // Formato para porcentajes: 63.39%
      return valueToUse.toFixed(0);
    }
  };

  // Determinar el color para valores positivos/negativos
  const getValueColor = () => {
    if (variant === 'profit') {
      const numValue = getCorrectValue();
      return numValue >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-slate-800';
  };

  // Renderizar gráfico semicircular mejorado usando Recharts
  const renderSemicircleChart = (isDay = false) => {
    const total = wins + losses;
    if (total === 0) return null;

    // Calcular los valores y porcentajes
    const winsValue = Math.max(0, wins);
    const lossesValue = Math.max(0, losses);
    const drawsValue = Math.max(0, draws);
    const totalWithoutDraws = winsValue + lossesValue;

    // Crear los datos con valores proporcionales para el gráfico
    const data = totalWithoutDraws > 0 ? [
      { name: 'Wins', value: winsValue },
      { name: 'Losses', value: lossesValue }
    ] : [
      { name: 'Empty', value: 1 }
    ];

    // Colores para cada sección
    const COLORS = totalWithoutDraws > 0 ? ['#10b981', '#ef4444'] : ['#e5e7eb'];

    // Crear una clave única para forzar la actualización
    const chartKey = `day-chart-${winsValue}-${lossesValue}-${drawsValue}-${Date.now()}`;

    // Calcular ángulos para cada sección
    const winsAngle = totalWithoutDraws > 0 ? (winsValue / totalWithoutDraws) * 180 : 0;

    // Ángulos de inicio y fin para cada sección
    const winStartAngle = 180;
    const winEndAngle = 180 - winsAngle;

    // Ángulos para la sección de breakeven (siempre en el medio)
    const breakevenWidth = drawsValue > 0 ? 10 : 0; // Ancho fijo para sección breakeven
    const breakevenStartAngle = winEndAngle;
    const breakevenEndAngle = winEndAngle - breakevenWidth;

    return (
      <div className="w-[100px] h-[80px] relative flex flex-col items-center">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          <PieChart>
            {/* Arco base gris */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy={50}
              startAngle={180}
              endAngle={0}
              innerRadius={37}
              outerRadius={44}
              fill="#e5e7eb"
              stroke="none"
              dataKey="value"
            />

            {/* Sectores coloreados */}
            <Pie
              data={data}
              cx="50%"
              cy={50}
              startAngle={180}
              endAngle={0}
              innerRadius={37}
              outerRadius={44}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
              isAnimationActive={false}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}-${chartKey}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            {/* Sección para breakeven trades, siempre en el medio */}
            {drawsValue > 0 && (
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy={50}
                startAngle={breakevenStartAngle}
                endAngle={breakevenEndAngle}
                innerRadius={37}
                outerRadius={44}
                fill="#818cf8"     // Color morado/azul para breakeven
                stroke="none"
                dataKey="value"
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Números debajo del gráfico */}
        <div className="w-full flex justify-between  mt-1">
          <div className="bg-green-50 w-8 h-6 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-green-600">{winsValue}</span>
          </div>

          <div className="bg-indigo-50 w-8 h-6 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-indigo-600">{drawsValue}</span>
          </div>

          <div className="bg-red-50 w-8 h-6 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-red-600">{lossesValue}</span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar gráfico para profit factor usando Recharts
  const renderProfitFactorChart = () => {
    const numValue = getCorrectValue();

    // Calcular el porcentaje para el círculo
    // Si el profit factor es 1, es 50% verde y 50% rojo
    // Si es mayor a 1, aumenta el verde; si es menor, aumenta el rojo
    let greenPercentage = 50;
    if (numValue > 1) {
      // Máximo 95% verde para profit factors muy altos
      greenPercentage = Math.min(50 + (numValue - 1) * 20, 95);
    } else if (numValue < 1) {
      // Mínimo 5% verde para profit factors muy bajos
      greenPercentage = Math.max(50 - (1 - numValue) * 30, 5);
    }

    const redPercentage = 100 - greenPercentage;

    // Crear una clave única para forzar la actualización
    const chartKey = `profit-factor-${numValue}-${Date.now()}`;

    // Datos para el gráfico (distribución verde/rojo)
    const data = [
      { name: 'Green', value: greenPercentage },
      { name: 'Red', value: redPercentage }
    ];

    return (
      <div className="w-[72px] h-[72px] relative flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={0}
              endAngle={360}
              innerRadius={30}
              outerRadius={35}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
              isAnimationActive={false}
              animationEasing="ease-out"
            >
              <Cell key="cell-0" fill="#10b981" />
              <Cell key="cell-1" fill="#ef4444" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Valor en el centro del círculo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-slate-800">{numValue.toFixed(1)}</span>
        </div>
      </div>
    );
  };

  // Diseño especial para Profit Factor (como en la imagen)
  const renderProfitFactorContent = () => {
    return (


      <div className="flex items-center justify-center w-full h-full gap-4">



        <div className="flex flex-col items-start justify-start">

          <div className="flex justify-center items-center gap-2">
            <h3 className="text-sm font-normal text-slate-700">{title}</h3>
            {info && (
              <div className="relative">
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip && (
                  <div className="absolute -left-16 top-5 z-10 w-48 p-[5px] bg-gray-800 text-white text-[10px] rounded shadow-lg">
                    {getTooltipText()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[30px] font-roboto font-bold text-slate-800">
            {formatValue()}
          </div>

        </div>

        <div>
          {renderProfitFactorChart()}
        </div>

      </div>


    );
  };

  // Renderizar gráfico para win/loss promedio como en la imagen
  const renderAvgTradeChart = () => {
    // Valores absolutos para cálculos
    const winAbs = Math.abs(winAmount);
    const lossAbs = Math.abs(lossAmount);
    const total = winAbs + lossAbs;

    // Calcular la proporción para el gráfico (con valor mínimo para evitar divisiones por cero)
    const winProportion = total > 0 ? (winAbs / total) * 100 : 50;

    // Formato de los valores monetarios
    const winFormatted = `$${winAbs.toFixed(2)}`;
    const lossFormatted = `-$${lossAbs.toFixed(2)}`;

    return (
      <div className="flex flex-col w-full">
        {/* Barra horizontal con proporción real */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full flex ">
          <div
            className="h-full rounded-l-full"
            style={{
              width: `${winProportion}%`,
              backgroundColor: '#2fac7e' // Color verde específico
            }}
          ></div>
          <div
            className="h-full rounded-r-full"
            style={{
              width: `${100 - winProportion}%`,
              backgroundColor: '#ef5350' // Color rojo específico
            }}
          ></div>
        </div>

        {/* Valores monetarios debajo de la barra */}
        <div className="flex justify-between w-full px-1">
          <span className="text-base font-semibold text-green-600">{winFormatted}</span>
          <span className="text-base font-semibold text-red-500">{lossFormatted}</span>
        </div>
      </div>
    );
  };

  // Renderizar gráfico específico para Trade Win
  const renderTradeWinChart = () => {
    if (wins + losses === 0) return null;

    // Asegurar que tenemos valores positivos para el cálculo
    const winsValue = Math.max(0, wins);
    const lossesValue = Math.max(0, losses);
    const drawsValue = Math.max(0, draws);
    const total = winsValue + lossesValue + drawsValue;

    // Crear los datos con valores proporcionales para asegurar la representación correcta
    const data = total > 0 ? [
      { name: 'Wins', value: winsValue },
      { name: 'Losses', value: lossesValue }
    ] : [
      { name: 'Empty', value: 1 }
    ];

    // Colores para cada sección - verde para wins, rojo para losses, gris si no hay datos
    const COLORS = total > 0 ? ['#10b981', '#ef4444'] : ['#e5e7eb'];

    // Crear una clave única para forzar la actualización del componente
    const chartKey = `chart-${winsValue}-${lossesValue}-${drawsValue}-${Date.now()}`;

    // Calcular ángulos para cada sección
    const totalTradesForAngle = winsValue + lossesValue;
    const winsAngle = totalTradesForAngle > 0 ? (winsValue / totalTradesForAngle) * 180 : 0;

    // Ángulos de inicio y fin para cada sección
    const winStartAngle = 180;
    const winEndAngle = 180 - winsAngle;

    // Ángulos para la sección de breakeven (siempre en el medio)
    const breakevenWidth = drawsValue > 0 ? 10 : 0; // Ancho fijo para sección breakeven
    const breakevenStartAngle = winEndAngle;
    const breakevenEndAngle = winEndAngle - breakevenWidth;

    return (
      <div className="w-[100px] h-[80px] relative flex flex-col items-center">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          <PieChart>
            {/* Arco base gris (visible solo cuando hay datos) */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy={45}
              startAngle={180}
              endAngle={0}
              innerRadius={37}  // Ajustado a un valor menos grueso
              outerRadius={44}  // Ajustado a un valor menos grueso
              fill="#e5e7eb"
              stroke="none"
              dataKey="value"
            />

            {/* Sectores coloreados con valores reales */}
            <Pie
              data={data}
              cx="50%"
              cy={45}
              startAngle={180}
              endAngle={0}
              innerRadius={37}  // Ajustado a un valor menos grueso
              outerRadius={44}  // Ajustado a un valor menos grueso
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
              isAnimationActive={false}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}-${chartKey}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            {/* Sección para breakeven trades, siempre en el medio */}
            {drawsValue > 0 && (
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy={45}
                startAngle={breakevenStartAngle}
                endAngle={breakevenEndAngle}
                innerRadius={37}  // Mismo valor que los otros arcos
                outerRadius={44}  // Mismo valor que los otros arcos
                fill="#818cf8"     // Color morado/azul para breakeven
                stroke="none"
                dataKey="value"
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Números debajo del gráfico */}
        <div className="w-full flex justify-between mt-1">
          <div className="bg-green-50 w-8 h-5 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-green-600">{winsValue}</span>
          </div>

          <div className="bg-indigo-50 w-8 h-5 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-indigo-600">{drawsValue}</span>
          </div>

          <div className="bg-red-50 w-8 h-5 flex items-center justify-center rounded-full">
            <span className="text-xs font-medium text-red-600">{lossesValue}</span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar el gráfico específico según el tipo de tarjeta
  const renderChart = () => {
    switch (variant) {
      case 'winrate':
        return renderTradeWinChart();
      case 'day-winrate':
        return renderSemicircleChart(true);
      case 'profit-factor':
        return renderProfitFactorChart();
      case 'avg-trade':
        return renderAvgTradeChart();
      default:
        return null;
    }
  };

  // Renderizar el contenido principal basado en el tipo de tarjeta
  const renderCardContent = () => {
    // Para la tarjeta de P&L
    if (variant === 'profit') {
      return (
        <div className="flex flex-row justify-around items-center h-full">

          <div className="flex flex-col items-center">

            <div className=" flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700 w-full">{title}</h3>
              {info && (
                <div className="relative ml-1">
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showTooltip && (
                    <div className="absolute -left-16 top-5 z-10 w-48 p-[5px] bg-gray-800 text-white text-[10px] rounded shadow-lg">
                      {getTooltipText()}
                    </div>
                  )}
                </div>
              )}
              {showPurpleIndicator && (
                <div className="w-5 h-5 rounded-xl bg-gray-200 pl-4 pr-4  text-black flex items-center justify-center text-[10px]">
                  {totalTrades}
                </div>
              )}

            </div>

            <div className="">

              <div className={`w-full font-roboto font-bold ${getValueColor()} text-[30px] h-full flex items-start justify-start flex-col`}>
                {prefix}{formatValue()}{suffix}
              </div>



            </div>

          </div>


          <div className="flex items-center justify-between">
            <div className="bg-indigo-50 p-2 rounded-md flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="10" width="10" height="4" rx="2" fill="#EBE9FE" />
                <rect x="4" y="0" width="2" height="40" rx="1" fill="#6366F1" />
                <rect x="18" y="0" width="2" height="40" rx="1" fill="#6366F1" />
                <rect x="11" y="0" width="2" height="40" rx="1" fill="#6366F1" />
              </svg>
            </div>
          </div>

        </div>
      );
    }

    // Diseño especial para Trade Win % (como en la imagen)
    if (variant === 'winrate') {
      return (
        <div className="flex flex-row justify-center items-center w-full h-full">

          <div className="flex flex-col">

            <div className="flex items-center">

              <div className="flex items-start justify-start">
                <h3 className="text-sm font-normal text-slate-700 lg:text-xs">{title}</h3>
              </div>
              {info && (
                <div className="relative ml-2">
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showTooltip && (
                    <div className="absolute -left-16 top-5 z-10 w-48 p-[5px] bg-gray-800 text-white text-[10px] rounded shadow-lg">
                      {getTooltipText()}
                    </div>
                  )}
                </div>
              )}


            </div>

            <div className="text-[30px] font-bold font-roboto text-slate-800">
              {prefix}
              {formatValue()}
              {suffix}
            </div>

          </div>

          <div>
            {renderTradeWinChart()}
          </div>

        </div>
      );
    }

    // Diseño especial para Day Win % estructura nueva
    if (variant === 'day-winrate') {
      return (


        <div className="flex flex-row justify-center items-center h-full w-full">


          <div className="">

            <div className=" flex items-center gap-2 relative">
              <h3 className="text-sm font-medium text-slate-700">{title}</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showTooltip && (
                <div className="absolute -left-0 top-5 z-10 w-48 p-[5px] bg-gray-800 text-white text-[10px] rounded shadow-lg">
                  {getTooltipText()}
                </div>
              )}

            </div>

            <div className="text-[30px] font-bold font-roboto text-slate-800">
              {prefix}
              {formatValue()}
              {suffix}
            </div>

          </div>


          <div>
            {renderSemicircleChart(true)}
          </div>

        </div>

      );
    }


    // Diseño especial para Profit Factor
    if (variant === 'profit-factor') {
      return renderProfitFactorContent();
    }

    // Diseño especial para Avg Trade (como en la imagen)
    if (variant === 'avg-trade') {
      return (
        <div className="flex flex-col justify-center items-start w-full h-full p-5">

          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-normal text-[#334155]">{title}</h3>
            {info && (
              <div className="relative">
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip && (
                  <div className="fixed right-20 top-30 z-10 w-48 p-[5px] bg-gray-800 text-white text-[10px] rounded shadow-lg">
                    {getTooltipText()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-6 items-center">
            <div className="text-[30px] font-roboto font-bold text-[#0f172a]">
              {formatValue()}
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-[110px] flex">
                <div
                  className="h-full rounded-l-full bg-[#2fac7e]"
                  style={{
                    width: `${(Math.abs(winAmount) / (Math.abs(winAmount) + Math.abs(lossAmount))) * 100}%`
                  }}
                ></div>
                <div
                  className="h-full rounded-r-full bg-[#ef5350]"
                  style={{
                    width: `${(Math.abs(lossAmount) / (Math.abs(winAmount) + Math.abs(lossAmount))) * 100}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between w-full">
                <span className="text-[15px] font-medium text-[#2fac7e]">${Math.abs(winAmount).toFixed(2)}</span>
                <span className="text-[15px] font-medium text-[#ef5350]">-${Math.abs(lossAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Para las otras tarjetas
    return (
      <>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            {info && (
              <div className="relative ml-1">
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip && (
                  <div className="fixed left-0 top-6 z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                    {getTooltipText()}
                  </div>
                )}
              </div>
            )}
          </div>
          {showPurpleIndicator && (
            <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex  justify-center text-xs">
              {totalTrades}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className={`text-3xl font-bold ${getValueColor()}`}>
            {prefix}{formatValue()}{suffix}
          </div>
          {renderChart()}
        </div>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100   text-black max-h-[130px] overflow-hidden">
      {renderCardContent()}
    </div>
  );
};

export default StatCard; 