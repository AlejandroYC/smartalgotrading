// NoteDetail.tsx
import React, { useState, useEffect } from "react";
import { format, parseISO } from 'date-fns';
import { useNotebook } from "@/hooks/useNotebook";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";

// Componente para estadísticas
function StatItem({ 
  label, 
  value, 
  isHighlighted = false,
  isPositive = false
}: { 
  label: string; 
  value: string;
  isHighlighted?: boolean;
  isPositive?: boolean;
}) {
  return (
    <div className="w-1/2 mb-2">
      <span className="block font-semibold text-gray-700">{label}</span>
      <span className={`
        ${isHighlighted ? 'font-semibold text-base' : ''} 
        ${isHighlighted && isPositive ? 'text-green-600' : ''} 
        ${isHighlighted && !isPositive ? 'text-red-600' : ''}
      `}>{value}</span>
    </div>
  );
}

export default function NoteDetail() {
  console.log("NoteDetail: Componente reconstruido");
  
  // Obtener nota seleccionada y funciones para datos de trading
  const { selectedNote, getTradingDayData, getDayTrades } = useNotebook();
  
  // Estados locales
  const [tradeData, setTradeData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [componentId] = useState(() => Math.random().toString(36).substring(2, 9)); // ID único para este montaje
  
  // Log para debug
  console.log(`NoteDetail (${componentId}): Renderizando con nota:`, selectedNote?.id, selectedNote?.title);

  // Cargar datos de trading cuando cambia la nota
  useEffect(() => {
    // Limpiar datos previos
    setTradeData(null);
    setChartData([]);
    
    // Si no hay nota seleccionada, terminamos
    if (!selectedNote) {
      console.log(`NoteDetail (${componentId}): Sin nota seleccionada`);
      return;
    }
    
    console.log(`NoteDetail (${componentId}): Procesando nota`, selectedNote.id, selectedNote.title);
    
    // Obtener datos de trading para la fecha de la nota
    const noteDate = selectedNote.trade_date;
    console.log(`NoteDetail (${componentId}): Buscando datos para`, noteDate);
    
    try {
      // Obtener datos para esta fecha
      const dayData = getTradingDayData(noteDate);
      
      if (dayData) {
        console.log(`NoteDetail (${componentId}): Datos encontrados:`, dayData);
        setTradeData(dayData);
        
        // Obtener operaciones para crear gráfico
        const dayTrades = getDayTrades(noteDate);
        
        // Si hay trades, generar datos para el gráfico
        if (dayTrades.length > 0) {
          // Ordenar trades por hora
          const sortedTrades = [...dayTrades].sort((a, b) => {
            const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
            const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
            return timeA - timeB;
          });
          
          // Crear puntos para el gráfico
          const graphPoints = [];
          let cumulativeProfit = 0;
          
          for (const trade of sortedTrades) {
            if (typeof trade.profit === 'number') {
              cumulativeProfit += trade.profit;
              
              // Extraer hora para el eje X
              let tradeTime;
              if (typeof trade.time === 'number') {
                tradeTime = new Date(trade.time * 1000);
              } else {
                tradeTime = new Date(trade.time);
              }
              
              const timeStr = format(tradeTime, 'HH:mm');
              
              graphPoints.push({
                name: timeStr,
                value: cumulativeProfit
              });
            }
          }
          
          if (graphPoints.length > 0) {
            setChartData(graphPoints);
          } else {
            setChartData([
              { name: "00:00", value: 0 },
              { name: "23:59", value: dayData.profit || 0 }
            ]);
          }
        } else {
          setChartData([
            { name: "00:00", value: 0 },
            { name: "23:59", value: dayData.profit || 0 }
          ]);
        }
      } else {
        // No hay datos para esta fecha
        setChartData([
          { name: "00:00", value: 0 },
          { name: "23:59", value: 0 }
        ]);
      }
    } catch (error) {
      console.error(`NoteDetail (${componentId}): Error al obtener datos:`, error);
      setChartData([
        { name: "00:00", value: 0 },
        { name: "23:59", value: 0 }
      ]);
    }
  }, [selectedNote, getTradingDayData, getDayTrades, componentId]);

  // Si no hay nota seleccionada, mostrar placeholder
  if (!selectedNote) {
    return (
      <div className="border-b border-gray-200 p-6 rounded-tl-lg flex items-center justify-center h-40 text-gray-400">
        Selecciona una nota para ver los detalles
      </div>
    );
  }

  // Formatear fechas
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy hh:mm a');
    } catch (error) {
      return dateStr;
    }
  };

  const tradeDateFormatted = format(parseISO(selectedNote.trade_date), 'EEE MMM dd, yyyy');
  const createdAtFormatted = formatDate(selectedNote.created_at);
  const updatedAtFormatted = formatDate(selectedNote.updated_at);

  // Determinar el color del gráfico basado en el profit del día
  const chartColor = tradeData && tradeData.profit > 0 ? "#10B981" : "#EF4444"; // Verde o rojo

  return (
    <div className="border-b border-gray-200 p-6 rounded-tl-lg">
      {/* Debug info */}
      <div className="text-xs text-gray-400 mb-2 flex justify-between">
        <span>ID: {selectedNote.id.substring(0, 8)}... | Fecha: {selectedNote.trade_date} | Instance: {componentId}</span>
        <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px]">
          Viendo nota: {selectedNote.title || tradeDateFormatted}
        </span>
      </div>
      
      {/* Indicador de disponibilidad de datos */}
      {tradeData ? (
        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mb-2 inline-block">
          <span className="font-medium">✓ Datos de trading disponibles</span>
        </div>
      ) : (
        <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded mb-2 inline-block">
          <span className="font-medium">⚠ No se encontraron datos de trading para esta fecha</span>
        </div>
      )}
      
      {/* Título y fechas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {selectedNote.title || tradeDateFormatted}
          </h2>
          <p className="text-sm text-gray-500">
            Created: {createdAtFormatted} | Last updated: {updatedAtFormatted}
          </p>
        </div>
        {selectedNote.account_number && (
          <span className="text-gray-600 text-sm font-medium">
            Account: {selectedNote.account_number}
          </span>
        )}
      </div>

      {/* Contenido de la nota (preview) */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="text-gray-600 text-sm line-clamp-3 mb-2">
          {selectedNote.content}
        </p>
      </div>

      {/* Gráfico y stats */}
      <div className="mt-4 flex flex-col md:flex-row">
        {/* Gráfico dinámico */}
        <div className="w-full md:w-1/2 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6B7280', fontSize: 10 }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                tick={{ fill: '#6B7280', fontSize: 10 }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fill="url(#profitGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="w-full md:w-1/2 flex flex-wrap text-sm text-gray-600 mt-4 md:mt-0 md:pl-6">
          <StatItem 
            label="Net P&L" 
            value={tradeData?.net_profit !== undefined 
              ? `$${tradeData.net_profit.toFixed(2)}` 
              : tradeData?.profit !== undefined 
                ? `$${tradeData.profit.toFixed(2)}` 
                : "N/A"
            } 
            isHighlighted={true}
            isPositive={tradeData?.profit > 0}
          />
          <StatItem label="Total Trades" value={tradeData?.trades?.toString() || "0"} />
          <StatItem label="Winners" value={tradeData?.winners?.toString() || "0"} />
          <StatItem label="Losers" value={tradeData?.losers?.toString() || "0"} />
          <StatItem 
            label="Win Rate" 
            value={tradeData && tradeData.trades > 0
              ? `${(((tradeData.winners || 0) / tradeData.trades) * 100).toFixed(0)}%`
              : "N/A"
            } 
          />
          <StatItem 
            label="Profit Factor" 
            value={tradeData?.profit_factor 
              ? tradeData.profit_factor.toFixed(2) 
              : "N/A"
            } 
          />
        </div>
      </div>
    </div>
  );
}
