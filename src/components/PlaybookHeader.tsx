"use client";

import React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import DateRangePicker from "@/components/DateRangePicker";
import AllAccountsPicker from "@/components/AllAccountsPicker";

export default function PlaybookHeader() {
  return (
    <header className="w-full bg-white h-16 flex items-center justify-between px-6 shadow-sm">
      {/* Izquierda: Título */}
      <h1 className="text-xl font-bold text-gray-800">Playbook</h1>

      {/* Derecha: Dropdowns */}
      <div className="flex items-center space-x-6">
        {/* Date range con popover */}
        <DateRangePicker />

        {/* All accounts con popover */}
        <AllAccountsPicker />
      </div>
    </header>
  );
}
