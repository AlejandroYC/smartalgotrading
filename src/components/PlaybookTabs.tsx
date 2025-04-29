"use client";

import React from "react";

interface PlaybookSubnavProps {
  activeTab: "my" | "shared" | "templates";
  setActiveTab: (tab: "my" | "shared" | "templates") => void;
}

export default function PlaybookSubnav({ activeTab, setActiveTab }: PlaybookSubnavProps) {
  const tabs = [
    { label: "My Playbook", value: "my" },
    { label: "Shared Playbook", value: "shared" },
    { label: "Templates", value: "templates" },
  ];

  return (
    <div className="flex space-x-4 px-6 py-3 bg-white shadow">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value as "my" | "shared" | "templates")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeTab === tab.value
              ? "bg-indigo-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
