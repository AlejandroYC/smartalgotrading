import React from "react";

export default function RecentlyUsedTemplates() {
  // En el futuro, podrías cargar plantillas reales desde la base de datos
  const templates = [
    { id: "1", name: "Daily Trading Review" },
    { id: "2", name: "Trade Analysis" },
    { id: "3", name: "Market Conditions" }
  ];

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">Recently used templates</span>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-md font-medium transition-colors">
          + Add Template
        </button>
      </div>
      
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {templates.map(template => (
            <button 
              key={template.id}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-md transition-colors"
            >
              {template.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 