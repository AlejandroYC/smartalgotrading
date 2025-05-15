// NotebookDashboard.tsx
"use client";
export const dynamic = 'force-dynamic';

import React, { useEffect } from "react";
import Header from "@/components/Header";
import Sidebarnote from "@/components/sidebarnote";
import NotesList from "@/components/NotesList";
import NoteDetail from "@/components/NoteDetail";
import TextEditor from "@/components/TextEditor";
import ChatBubble from "@/components/ChatBubble";
import RecentlyUsedTemplates from "@/components/RecentlyUsedTemplates";
import { useNotebook } from "@/hooks/useNotebook";

// Componente wrapper que recreará completamente NoteDetail cuando cambie la nota
const NoteDetailWrapper = ({ noteId }: { noteId: string | null }) => {
  console.log("NotebookDashboard: Renderizando NoteDetail con ID:", noteId);
  
  // Este componente se recrea cada vez que cambia el ID
  return <NoteDetail key={noteId || 'no-note'} />;
};

export default function NotebookDashboard() {
  const { loadNotes, error, selectedNote } = useNotebook();
  
  // Cargar notas al montar el componente
  useEffect(() => {
    console.log("NotebookDashboard: Initial load");
    loadNotes();
  }, [loadNotes]);
  
  // Log en caso de error
  useEffect(() => {
    if (error) {
      console.error("NotebookDashboard: Error loading notes:", error);
    }
  }, [error]);

  // Log para verificar cambios en la nota seleccionada
  useEffect(() => {
    console.log("NotebookDashboard: Selected note changed:", 
      selectedNote?.id, 
      selectedNote?.title, 
      selectedNote?.trade_date
    );
  }, [selectedNote]);

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
          {/* Usamos un wrapper que fuerza recreación completa del componente cuando cambia la nota */}
          <NoteDetailWrapper noteId={selectedNote?.id || null} />
          
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
