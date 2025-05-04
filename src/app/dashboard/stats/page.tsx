'use client';

import React, { useState, useEffect } from 'react';
import { useTradingData } from '@/contexts/TradingDataContext';
import FilterBar from '@/components/FilterBar';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import StatsOverview from '@/components/StatsOverview';
import StatsDetails from '@/components/StatsDetails';

export default function StatsPage() {
  const { loading, error } = useTradingData();
  
  // Función para calcular estadísticas
  const calculateStats = () => {
    // Aquí iría la lógica para calcular las estadísticas
    // Basado en los datos filtrados por fecha
    return {
      overallPerformance: {
        totalDays: 45,
        winningDays: 32,
        losingDays: 13,
        winRate: 71.1
      },
      dailyStats: {
        avgDailyPL: 132.45,
        bestDay: 578.20,
        worstDay: -245.80
      },
      operationStats: {
        totalTrades: 156,
        winningTrades: 94,
        losingTrades: 62,
        winRate: 60.3,
        avgWinAmount: 42.35,
        avgLossAmount: 28.42,
        profitFactor: 2.7
      },
      mostTraded: [
        { symbol: 'EUR/USD', count: 45, winRate: 64 },
        { symbol: 'GBP/USD', count: 32, winRate: 59 },
        { symbol: 'USD/JPY', count: 28, winRate: 71 }
      ],
      bestDays: [
        { date: '2023-11-15', pl: 578.20 },
        { date: '2023-12-01', pl: 423.80 },
        { date: '2023-10-22', pl: 356.40 }
      ],
      worstDays: [
        { date: '2023-11-08', pl: -245.80 },
        { date: '2023-10-30', pl: -187.20 },
        { date: '2023-12-10', pl: -152.60 }
      ]
    };
  };

  const stats = calculateStats();

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      {/* Header con título y barra de filtros en dos columnas */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-black">Estadísticas de Trading</h2>
        
        <FilterBar className="w-full md:w-auto" />
      </div>
      
      {loading && <LoadingIndicator />}
      
      {error && (
        <div className="text-red-500 p-4 border border-red-300 rounded-md mb-6">
          Error cargando datos: {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-6">
          {/* Vista general de estadísticas */}
          <StatsOverview />
          
          {/* Detalles de estadísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rendimiento general */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Rendimiento General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-500">Total de Días</div>
                  <div className="text-2xl font-bold">{stats.overallPerformance.totalDays}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-500">Días Ganadores</div>
                  <div className="text-2xl font-bold text-green-600">{stats.overallPerformance.winningDays}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-500">Días Perdedores</div>
                  <div className="text-2xl font-bold text-red-600">{stats.overallPerformance.losingDays}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-500">Win Rate Diario</div>
                  <div className="text-2xl font-bold">{stats.overallPerformance.winRate}%</div>
                </div>
              </div>
            </div>
            
            {/* Estadísticas diarias */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Estadísticas Diarias</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">P&L Diario Promedio</span>
                  <span className="text-green-600">${stats.dailyStats.avgDailyPL.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Mejor Día</span>
                  <span className="text-green-600">${stats.dailyStats.bestDay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">Peor Día</span>
                  <span className="text-red-600">-${Math.abs(stats.dailyStats.worstDay).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Estadísticas de operaciones */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Estadísticas de Operaciones</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Total Operaciones</span>
                  <span>{stats.operationStats.totalTrades}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Win Rate</span>
                  <span>{stats.operationStats.winRate}%</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Operaciones Ganadoras</span>
                  <span className="text-green-600">{stats.operationStats.winningTrades}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Operaciones Perdedoras</span>
                  <span className="text-red-600">{stats.operationStats.losingTrades}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Ganancia Promedio</span>
                  <span className="text-green-600">${stats.operationStats.avgWinAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Pérdida Promedio</span>
                  <span className="text-red-600">-${stats.operationStats.avgLossAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 col-span-2">
                  <span className="font-medium">Factor de Beneficio</span>
                  <span>{stats.operationStats.profitFactor}</span>
                </div>
              </div>
            </div>
            
            {/* Instrumentos más operados */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Instrumentos Más Operados</h3>
              <div className="space-y-4">
                {stats.mostTraded.map((instrument, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium">{instrument.symbol}</div>
                      <div className="text-sm text-gray-500">{instrument.count} operaciones</div>
                    </div>
                    <div className="text-lg font-bold">
                      {instrument.winRate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mejores y peores días */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm lg:col-span-2">
              <h3 className="text-lg font-medium mb-4">Mejores y Peores Días</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium mb-3 text-green-600">Mejores Días</h4>
                  <div className="space-y-2">
                    {stats.bestDays.map((day, index) => (
                      <div key={index} className="flex justify-between p-2 bg-green-50 rounded-md">
                        <span>{day.date}</span>
                        <span className="font-bold text-green-600">${day.pl.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium mb-3 text-red-600">Peores Días</h4>
                  <div className="space-y-2">
                    {stats.worstDays.map((day, index) => (
                      <div key={index} className="flex justify-between p-2 bg-red-50 rounded-md">
                        <span>{day.date}</span>
                        <span className="font-bold text-red-600">-${Math.abs(day.pl).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 