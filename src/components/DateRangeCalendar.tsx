"use client";

import React from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

export default function DateRangeCalendar() {
  return (
    <div className="flex flex-col p-4">
      {/* Cabecera: Start Date / End Date */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
        <div className="text-sm font-semibold text-gray-600">Start Date</div>
        <div className="text-sm font-semibold text-gray-600">End Date</div>
      </div>

      <div className="flex space-x-6">
        {/* Calendario Izquierdo */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-gray-700 mb-2">
            <button className="text-sm text-gray-500 hover:text-gray-700">&lt;</button>
            <span className="text-sm font-medium">
              Feb <span className="text-gray-400">2025</span>
            </span>
            <button className="text-sm text-gray-500 hover:text-gray-700">&gt;</button>
          </div>
          <CalendarMock />
        </div>

        {/* Calendario Derecho */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-gray-700 mb-2">
            <button className="text-sm text-gray-500 hover:text-gray-700">&lt;</button>
            <span className="text-sm font-medium">
              Mar <span className="text-gray-400">2025</span>
            </span>
            <button className="text-sm text-gray-500 hover:text-gray-700">&gt;</button>
          </div>
          <CalendarMock />
        </div>

        {/* Lista de presets */}
        <div className="w-40 border-l border-gray-200 pl-4">
          <ul className="text-sm text-gray-600 space-y-1 h-[220px] overflow-auto">
            <PresetItem label="Today" />
            <PresetItem label="This Week" />
            <PresetItem label="This Month" />
            <PresetItem label="Last 30 Days" />
            <PresetItem label="Last Month" />
            <PresetItem label="This Quarter" />
            <PresetItem label="YTD (year to date)" />
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Mock de calendario para mostrar los días (no funcional) */
function CalendarMock() {
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  // Ejemplo de días en una matriz. Ajusta según tu lógica real.
  const matrix = [
    [29, 30, 31, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 1, 2, 3],
  ];

  return (
    <div className="w-64 border border-gray-200 rounded">
      <div className="grid grid-cols-7 text-center bg-gray-50 text-xs font-semibold text-gray-500">
        {days.map((d) => (
          <div key={d} className="p-1">
            {d}
          </div>
        ))}
      </div>
      {/* Días del mes (mock) */}
      {matrix.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 text-center text-sm">
          {week.map((day, di) => (
            <div
              key={di}
              className="p-2 hover:bg-indigo-50 cursor-pointer text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Item de preset */
function PresetItem({ label }: { label: string }) {
  return (
    <li>
      <button className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded">
        {label}
      </button>
    </li>
  );
}
