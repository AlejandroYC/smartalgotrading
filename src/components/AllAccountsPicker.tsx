"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

interface AccountItem {
  name: string;
  checked?: boolean;
}

const accountsList: AccountItem[] = [
  { name: "All Accounts", checked: true },
  { name: "My accounts" },
  { name: "MT5 3866", checked: true },
];

export default function AllAccountsPicker() {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Cierra el popover si se hace click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Botón principal */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center text-gray-500 hover:text-gray-700 space-x-1"
      >
        <span>All Accounts</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 shadow-lg rounded z-50">
          <ul className="py-1 text-sm text-gray-700">
            {accountsList.map((account) => (
              <li key={account.name}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2"
                  // Aquí puedes añadir la lógica para marcar/desmarcar la cuenta
                  onClick={() => console.log(`Selected ${account.name}`)}
                >
                  {/* Check icon si la cuenta está marcada */}
                  {account.checked && (
                    <CheckIcon className="w-4 h-4 text-indigo-500" />
                  )}
                  <span>{account.name}</span>
                </button>
              </li>
            ))}

            {/* Separador */}
            <li className="border-t border-gray-200 mt-1" />

            {/* Manage Accounts */}
            <li>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2 text-gray-600"
                onClick={() => console.log("Manage Accounts")}
              >
                Manage Accounts
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
