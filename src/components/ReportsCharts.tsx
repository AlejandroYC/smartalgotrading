"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// Datos para el gráfico de área
const areaData = [
  { date: "02/25/2025", value: 100 },
  { date: "02/26/2025", value: 180 },
  { date: "02/27/2025", value: 150 },
  { date: "02/28/2025", value: 220 },
  { date: "03/01/2025", value: 270 },
];

// Datos para el gráfico de barras
const barData = [
  { date: "02/25/2025", pl: 30 },
  { date: "02/26/2025", pl: -20 },
  { date: "02/27/2025", pl: 45 },
  { date: "02/28/2025", pl: 10 },
  { date: "03/01/2025", pl: 60 },
];

export default function ReportsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
      {/* Chart 1: DAILY NET CUMULATIVE P&L */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          DAILY NET CUMULATIVE P&L
        </h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="areaColorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" fontSize={10} tick={{ fill: "#6B7280" }} />
              <YAxis fontSize={10} tickFormatter={(value) => `$${value}`} tick={{ fill: "#6B7280" }} />
              <Tooltip formatter={(value) => [`$${value}`, "P&L"]} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366F1"
                fill="url(#areaColorGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: NET DAILY P&L */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          NET DAILY P&L
        </h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20 }}>
              <XAxis dataKey="date" fontSize={10} tick={{ fill: "#6B7280" }} />
              <YAxis fontSize={10} tickFormatter={(value) => `$${value}`} tick={{ fill: "#6B7280" }} />
              <Tooltip formatter={(value) => [`$${value}`, "P&L"]} />
              <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? "#10B981" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
