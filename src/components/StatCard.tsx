import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
  
  // Calcular el porcentaje real de días ganadores
  const calculateDayWinRate = () => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return (wins / total) * 100;
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
      return calculateWinRate();
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
      // Formato para valores con 2 decimales: 3.47, 2.00
      return valueToUse.toFixed(2);
    } else {
      // Formato para porcentajes: 63.39%
      return valueToUse.toFixed(2);
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
    const total = wins + losses + draws;
    if (total === 0) return null;
    
    // Calcular los valores y porcentajes
    const winsValue = Math.max(0, wins);
    const lossesValue = Math.max(0, losses);
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
    const chartKey = `day-chart-${winsValue}-${lossesValue}-${Date.now()}`;
    
    return (
      <div className="w-[140px] h-[80px] relative">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          <PieChart>
            {/* Arco base gris */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy={45}
              startAngle={180}
              endAngle={0}
              innerRadius={37}
              outerRadius={43}
              fill="#e5e7eb"
              stroke="none"
              dataKey="value"
            />
            
            {/* Sectores coloreados */}
            <Pie
              data={data}
              cx="50%"
              cy={45}
              startAngle={180}
              endAngle={0}
              innerRadius={37}
              outerRadius={43}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
              isAnimationActive={true}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}-${chartKey}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Valores en los extremos - más cerca del semicírculo */}
        <div className="absolute top-0 w-[96px] h-[48px] px-2 flex justify-between">
          <span className="text-xs font-medium text-green-600 mt-[58px]">{winsValue}</span>
          <span className="text-xs font-medium text-red-600 mt-[58px]">{lossesValue}</span>
        </div>
        
        {/* Círculo morado para draws */}
        {draws > 0 && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-14">
            <div className="w-5 h-5 rounded-full bg-white border border-indigo-400 flex  justify-center">
              <span className="text-xs font-medium text-indigo-500">{draws}</span>
            </div>
          </div>
        )}
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
      <div className="w-[80px] h-[80px] relative mb-[10px]">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={0}
              endAngle={360}
              innerRadius={32}
              outerRadius={38}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
              isAnimationActive={true}
              animationEasing="ease-out"
            >
              <Cell key="cell-0" fill="#10b981" />
              <Cell key="cell-1" fill="#ef4444" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Diseño especial para Profit Factor (como en la imagen)
  const renderProfitFactorContent = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex  ">
          <h3 className="text-sm font-medium text-slate-700">{title}</h3>
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
                <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                  {getTooltipText()}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex  justify-between">
          <div className="text-[26px] font-bold text-slate-800">
            {formatValue()}
          </div>
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
    const winFormatted = `$${winAbs.toFixed(1)}`;
    const lossFormatted = `-$${lossAbs.toFixed(1)}`;
    
    return (
      <div className="flex flex-col mt-3">
        {/* Barra horizontal con proporción real */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden w-full flex mb-2">
          <div 
            className="h-full" 
            style={{ 
              width: `${winProportion}%`, 
              backgroundColor: '#2fac7e' // Color verde específico
            }}
          ></div>
          <div 
            className="h-full" 
            style={{ 
              width: `${100 - winProportion}%`,
              backgroundColor: '#ef5350' // Color rojo específico
            }}
          ></div>
        </div>
        
        {/* Valores monetarios debajo de la barra */}
        <div className="flex justify-between w-full">
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
    const total = winsValue + lossesValue;
    
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
    const chartKey = `chart-${winsValue}-${lossesValue}-${Date.now()}`;
    
    return (
      <div className="w-[140px] h-[80px] relative">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          <PieChart>
            {/* Arco base gris (visible solo cuando hay datos) */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy={45}
              startAngle={180}
              endAngle={0}
              innerRadius={37}
              outerRadius={43}
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
              innerRadius={37}
              outerRadius={43}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
              isAnimationActive={true}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}-${chartKey}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Valores en los extremos - más cerca del semicírculo */}
        <div className="absolute top-0 w-full px-2 flex justify-between">
          <span className="text-xs font-medium text-green-600 mt-[58px]">{winsValue}</span>
          <span className="text-xs font-medium text-red-600 mt-[58px]">{lossesValue}</span>
        </div>
        
        {/* Círculo morado para draws */}
        {draws > 0 && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-14">
            <div className="w-5 h-5 rounded-full bg-white border border-indigo-400 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-500">{draws}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Alternate implementation using Chart.js
  /*
  const renderTradeWinChartWithChartJS = () => {
    if (wins + losses === 0) return null;
    
    // Calcular porcentajes para cada sección
    const totalWithoutDraws = wins + losses;
    const winPercent = totalWithoutDraws > 0 ? (wins / totalWithoutDraws) * 100 : 0;
    const lossPercent = 100 - winPercent;
    
    const data = {
      datasets: [
        {
          data: [winPercent, lossPercent],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      }
    };
    
    return (
      <div className="w-[140px] relative">
        <div className="h-[80px]">
          <Doughnut data={data} options={options} />
        </div>
        
        <div className="flex justify-between px-2">
          <span className="text-xs font-medium text-green-600">{wins}</span>
          <span className="text-xs font-medium text-red-600">{losses}</span>
        </div>
        
        {draws > 0 && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-[55px]">
            <div className="w-5 h-5 rounded-full bg-white border border-indigo-400 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-500">{draws}</span>
            </div>
          </div>
        )}
      </div>
    );
  };
  */

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
    // Para Net P&L con indicador morado
    if (variant === 'profit' && showPurpleIndicator) {
      return (
        <div className="flex flex-col">
          <div className="flex justify-between ">
            <div className="flex relative">
              <h3 className="text-sm font-medium text-gray-700">{title}</h3>
              {info && (
                <div className="relative">
                  <button 
                    className="ml-1 text-gray-400 hover:text-gray-600"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showTooltip && (
                    <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                      {getTooltipText()}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">{totalTrades}</div>
          </div>
          <div className="flex  justify-between mt-7">
            <div className={`text-[26px] font-bold ${getValueColor()}`}>
              {prefix}{formatValue()}{suffix}
            </div>
            <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-xs">ⓘ</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Diseño especial para Day Win % y Win Rate
    if (variant === 'day-winrate' || variant === 'winrate') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex ">
            <h3 className="text-sm font-medium text-slate-700">{title}</h3>
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
                  <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                    {getTooltipText()}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <div className="text-[26px] font-bold text-slate-800">
              {/* Usar el valor calculado según el tipo */}
              {prefix}
              {variant === 'day-winrate' ? calculateDayWinRate().toFixed(2) : calculateWinRate().toFixed(2)}
              {suffix}
            </div>
            {renderChart()}
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
        <div className="flex flex-col h-full">
          <div className="flex  ">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
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
                  <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                    {getTooltipText()}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col">
            <div className="text-[26px] font-bold text-slate-800 mb-2">
              {formatValue()}
            </div>
            {renderAvgTradeChart()}
          </div>
        </div>
      );
    }
    
    // Para las otras tarjetas
    return (
      <>
        <div className="flex justify-between items-start mb-3">
          <div className="flex  relative">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            {info && (
              <div className="relative">
                <button 
                  className="ml-1 text-gray-400 hover:text-gray-600"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showTooltip && (
                  <div className="absolute left-0 top-6 z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
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
        
        <div className="flex  justify-between">
          <div className={`text-3xl font-bold ${getValueColor()}`}>
            {prefix}{formatValue()}{suffix}
          </div>
          {renderChart()}
        </div>
      </>
    );
  };


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-black max-h-[120px] wm-full overflow-hidden">

      {renderCardContent()}
    </div>
  );
};

export default StatCard; 