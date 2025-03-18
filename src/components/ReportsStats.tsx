"use client";

import React from "react";

/**
 * Sección de estadísticas con:
 * - Título "Your Stats"
 * - Subtítulo "(ALL DATES)"
 * - Lista de estadísticas dividida en dos columnas bien alineadas
 */
export default function ReportsStats() {
  return (
    <section className="bg-white border border-gray-200 rounded-md shadow-sm p-6">
      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-800">YOUR STATS</h3>
      <p className="text-xs text-gray-500 mb-4">(ALL DATES)</p>

      {/* Contenedor de estadísticas en 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-sm text-gray-700">
        {statsData.map((pair, index) => (
          <div key={index} className="flex justify-between border-b py-1">
            <span>{pair.label}</span>
            <span className="font-medium">{pair.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Datos de las estadísticas en pares (para alinear bien en columnas)
 */
const statsData = [
  { label: "Total P&L", value: "$3,514.06" },
  { label: "Average Daily Volume", value: "1.00" },
  { label: "Average Winning Trade", value: "$34.11" },
  { label: "Average Losing Trade", value: "-$17.04" },
  { label: "Total Number of Trades", value: "241" },
  { label: "Number of Winning Trades", value: "149" },
  { label: "Number of Losing Trades", value: "92" },
  { label: "Number of Break Even Trades", value: "0" },
  { label: "Max Consecutive Wins", value: "18" },
  { label: "Max Consecutive Losses", value: "28" },
  { label: "Total Commissions", value: "$0.00" },
  { label: "Total Fees", value: "$0.00" },
  { label: "Total Swap", value: "-$105.30" },
  { label: "Largest Profit", value: "$821.60" },
  { label: "Largest Loss", value: "-$684.07" },
  { label: "Average Hold Time (All Trades)", value: "2 days, 39 minutes" },
  { label: "Average Hold Time (Winning Trades)", value: "1 day, 13 hours, 40 minutes" },
  { label: "Average Hold Time (Losing Trades)", value: "2 days, 18 hours, 27 minutes" },
  { label: "Average Hold Time (Scratch Trades)", value: "N/A" },
  { label: "Average Trade P&L", value: "$7.29" },
  { label: "Profit Factor", value: "3.24" },
  { label: "Open Trades", value: "11" },
  { label: "Total Trading Days", value: "38" },
  { label: "Winning Days", value: "25" },
  { label: "Losing Days", value: "5" },
  { label: "Breakeven Days", value: "4" },
  { label: "Logged Days", value: "2" },
  { label: "Max Consecutive Winning Days", value: "16" },
  { label: "Max Consecutive Losing Days", value: "2" },
  { label: "Average Daily P&L", value: "$92.48" },
  { label: "Average Winning Day P&L", value: "$172.49" },
  { label: "Average Losing Day P&L", value: "-$159.63" },
  { label: "Largest Profitable Day (Profits)", value: "$902.60" },
  { label: "Largest Losing Day (Losses)", value: "-$683.08" },
  { label: "Average Planned R-Multiple", value: "4.23R" },
  { label: "Average Realized R-Multiple", value: "-0.21R" },
  { label: "Trade Expectancy", value: "$14.58" },
  { label: "Max Drawdown", value: "-$751.07" },
  { label: "Max Drawdown, %", value: "-24.77%" },
  { label: "Average Drawdown", value: "-$201.95" },
  { label: "Average Drawdown, %", value: "-8.26%" },
];
