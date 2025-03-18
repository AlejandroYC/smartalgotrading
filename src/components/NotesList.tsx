// NotesList.tsx
import React from "react";

export default function NotesList() {
  return (
    <aside className="w-64 border border-gray-200 bg-white flex flex-col 
    shadow-[-4px_0_12px_rgba(0,0,0,0.12)] 
    mr-5 
    rounded-tl-lg">
      {/* Barra superior: Select All / Log day */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        
        <button className="bg-indigo-500 text-white px-3 py-1.5 rounded-md text-sm font-medium">
          Log day
        </button>
      </div>

      {/* Lista de notas */}
      <div className="flex-1 overflow-auto text-sm">
        <NoteListItem date="Mon Feb 24, 2025" netPL="$0.27" />
        <NoteListItem date="Sat, Feb 22, 2025" netPL="$1.19" />
        <NoteListItem date="Wed, Feb 19, 2025" netPL="$0.89" />
      </div>
    </aside>
  );
}

function NoteListItem({ date, netPL }: { date: string; netPL: string }) {
  return (
    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex flex-col">
      <span className="font-semibold text-gray-800">{date}</span>
      <span className="text-xs text-gray-500">Net P&L {netPL}</span>
    </button>
  );
}
