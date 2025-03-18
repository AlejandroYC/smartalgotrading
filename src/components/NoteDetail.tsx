// NoteDetail.tsx
import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";

// Datos de ejemplo para el gráfico
const chartData = [
  { name: "00:00", value: 50 },
  { name: "01:00", value: 45 },
  { name: "02:00", value: 60 },
  { name: "03:00", value: 40 },
  { name: "04:00", value: 35 },
  { name: "05:00", value: 20 },
];

export default function NoteDetail() {
  return (
    <div className="border-b border-gray-200 p-6  rounded-tl-lg">
      {/* Título y Net P&L */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Mon Feb 24, 2025</h2>
          <p className="text-sm text-gray-500">
            Created: Feb 24, 2025 12:19 PM | Last updated: Feb 26, 2025 12:19 PM
          </p>
        </div>
        <span className="text-green-600 text-base font-semibold">Net P&L $0.27</span>
      </div>

      {/* Gráfico y stats */}
      <div className="mt-4 flex flex-col md:flex-row">
        {/* Gráfico rojo */}
        <div className="w-full md:w-1/2 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis hide dataKey="name" />
              <YAxis hide />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#EF4444"
                fill="url(#netGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="w-full md:w-1/2 flex flex-wrap text-sm text-gray-600 mt-4 md:mt-0 md:pl-6">
          <StatItem label="Total Trades" value="5" />
          <StatItem label="Winners" value="3" />
          <StatItem label="Losers" value="2" />
          <StatItem label="Gross P&L" value="-0.95" />
          <StatItem label="Commissions" value="0.09" />
          <StatItem label="Profit Factor" value="0.13" />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-1/2 mb-2">
      <span className="block font-semibold text-gray-700">{label}</span>
      <span>{value}</span>
    </div>
  );
}
