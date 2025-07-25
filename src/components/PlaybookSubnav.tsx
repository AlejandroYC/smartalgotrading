"use client";

import React from "react";

interface PlaybookSubnavProps {
  activeTab: "my" | "shared" | "templates";
  setActiveTab: (tab: "my" | "shared" | "templates") => void;
}

const PlaybookSubnav: React.FC<PlaybookSubnavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { label: "My playbook", value: "my" },
    { label: "Shared playbook", value: "shared" },
    { label: "Templates", value: "templates" },
  ];

  return (
    <div className="flex space-x-6 px-6 py-4 bg-[#F8F9FC] ">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value as "my" | "shared" | "templates")}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
            activeTab === tab.value
              ? "bg-[#E8E7FB] text-[#5D5FEF]" // activo: fondo morado claro, texto morado
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default PlaybookSubnav;
