"use client";

import React from "react";
import TradeTable from "../../../components/TradeTable";
import StatCard from "../../../components/StatCard";

export default function Dashboard() {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      <h1 className="w-full text-2xl font-bold mb-4 text-black">Trades</h1>

      {/* Net Cumulative P&L */}
      <StatCard
        title="Net Cumulative P&L"
        value="$3,126.55"
        type="area"
        data={areaData}
        unit="US$"
      />

      {/* Profit Factor */}
      <StatCard
        title="Profit Factor"
        value="3.04"
        type="radial"
        data={profitFactorData}
      />

      {/* Trade Win % */}
      <StatCard
        title="Trade Win %"
        value="60.62%"
        type="pie"
        data={tradeWinData}
      />

      {/* Avg win/loss trade */}
      <div className="w-[350px] h-[150px] bg-white rounded-md shadow p-2 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500 font-medium mt-5">Avg win/loss trade</span>
        </div>
        <div className="text-2xl font-bold text-gray-800 mb-1 ">1.98</div>
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="absolute h-full bg-green-400 rounded-full" style={{ width: "66%" }}></div>
          <div className="absolute h-full bg-red-400 rounded-full" style={{ width: "34%", left: "66%" }}></div>
        </div>
        <div className="flex w-full justify-between text-xs mt-1 px-1">
          <span className="text-green-500 font-semibold">$34</span>
          <span className="text-red-500 font-semibold">-$17.2</span>
        </div>
      </div>

      {/* Trade Table */}
      <div className="w-full">
        <TradeTable />
      </div>
    </div>
  );
}

// Datos de ejemplo
const areaData = [
  { name: "Jan", uv: 30 },
  { name: "Feb", uv: 60 },
  { name: "Mar", uv: 45 },
  { name: "Apr", uv: 80 },
  { name: "May", uv: 70 },
  { name: "Jun", uv: 110 },
];

const profitFactorData = [{ name: "Profit", value: 3.04, fill: "#10B981" }];

const tradeWinData = [
  { name: "Win", value: 60.62, fill: "#10B981" },
  { name: "Rest", value: 39.38, fill: "#E5E7EB" },
];