"use client";

import React from "react";

export default function PlaybookSubnav() {
  return (
    <nav className="flex items-center bg-white border-b border-gray-200 px-6 h-12">
      {/* My Playbook */}
      <button className="mr-6 text-gray-800 font-medium border-b-2 border-indigo-500 h-full px-2">
        My Playbook
      </button>

      {/* Shared Playbook */}
      <button className="text-gray-500 hover:text-gray-700 h-full px-2">
        Shared Playbook
      </button>
    </nav>
  );
}
