// NotebookDashboard.tsx
"use client";
export const dynamic = 'force-dynamic';

import React from "react";
import Header from "@/components/Header";
import Sidebarnote from "@/components/sidebarnote";
import NotesList from "@/components/NotesList";
import NoteDetail from "@/components/NoteDetail";
import TextEditor from "@/components/TextEditor";
import ChatBubble from "@/components/ChatBubble";

export default function NotebookDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-sm text-gray-700">
      {/* Encabezado principal */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebarnote />

        {/* Lista de notas */}
        <NotesList />

        {/* Vista detallada de la nota + Editor */}
        <div className="flex-1 flex flex-col overflow-auto px-6">
          <NoteDetail />
          {/* Sección inferior (Editor y lo que necesites) */}
          <div className="flex flex-col flex-1 px-6 pb-6">
            <RecentlyUsedTemplates />
            <TextEditor />
          </div>
        </div>
      </div>

      {/* Burbuja flotante (Chat, help, etc.) */}
      <ChatBubble />
    </div>
  );
}

/* 
   Ejemplo de componente para 'Recently used templates' 
   que aparece entre la NoteDetail y el editor
*/
function RecentlyUsedTemplates() {
  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">Recently used templates</span>
        <button className="bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-md font-medium">
          + Add Template
        </button>
      </div>
    </div>
  );
}
