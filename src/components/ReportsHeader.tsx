"use client";

import React from "react";
import {
  FunnelIcon,
  CalendarIcon,
  WalletIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

export default function ReportsHeader() {
  return (
    <header className="w-full h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white shadow-sm">
      <h1 className="text-lg font-semibold text-gray-800">Reports</h1>

      <div className="flex items-center border border-gray-200 rounded-md shadow-sm bg-white">
        <HeaderItem
          icon={<FunnelIcon className="w-4 h-4 text-purple-500" />}
          label="Filters"
        />
        <div className="w-px h-6 bg-gray-200" />
        <HeaderItem
          icon={<CalendarIcon className="w-4 h-4 text-purple-500" />}
          label="Date range"
        />
        <div className="w-px h-6 bg-gray-200" />
        <HeaderItem
          icon={<WalletIcon className="w-4 h-4 text-purple-500" />}
          label="All Accounts"
        />
      </div>
    </header>
  );
}

function HeaderItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center px-3 py-2 space-x-1 text-sm text-gray-600 hover:text-gray-800">
      {icon}
      <span>{label}</span>
      <ChevronDownIcon className="w-4 h-4 text-purple-500" />
    </button>
  );
}
