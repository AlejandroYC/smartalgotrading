"use client";

import React from "react";
import { MagnifyingGlassIcon, ChevronDownIcon, BellIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm">
      {/* Fila superior: Título y menú de usuario */}
      <div className="flex items-center justify-between px-6 ">
        {/* Título */}
        <div className="text-xl font-bold text-gray-800">Notebook</div>
        {/* Menú de usuario */}
        <div className="flex items-center space-x-4">
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <span>All Accounts</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <BellIcon className="w-5 h-5" />
          </button>
          <button className="flex items-center">
            <Image
              src="/avatar.png"
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          </button>
        </div>
      </div>

      {/* Fila inferior: Barra de búsqueda */}
      <div className="px-6 py-6">
        <div className="relative max-w-lg">
          <MagnifyingGlassIcon className="absolute top-2 left-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-200 text-sm"
          />
        </div>
      </div>
    </header>
  );
}
