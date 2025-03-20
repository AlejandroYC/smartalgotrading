"use client";

import React from "react";

export default function StatsDetails() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-6">
      <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
        <StatRow label="Net P&L" value="$3,126.20" />
        <StatRow label="Total Trades" value="63" />
        <StatRow label="Trade Win %" value="60.82%" />
      </div>

      <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
        <StatRow label="Best Trading Day P&L" value="$187.20" />
        <StatRow label="Losing Days" value="17" />
        <StatRow label="Winning Days" value="46" />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-gray-600 py-1">
      <span className="font-medium text-gray-700">{label}</span>
      <span>{value}</span>
    </div>
  );
}
