// TextEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { format } from 'date-fns';
import { useNotebook } from "@/hooks/useNotebook";
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon } from "../components/icons";

export default function TextEditor() {
  const { selectedNote, saveNote } = useNotebook();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const previousNoteIdRef = useRef<string | null>(null);

  // Cargar el contenido cuando se selecciona una nueva nota
  useEffect(() => {
    console.log("TextEditor: Selected note changed:", selectedNote?.id, selectedNote?.title);
    
    // Verificar si realmente cambió la nota
    const noteId = selectedNote?.id || null;
    const noteChanged = noteId !== previousNoteIdRef.current;
    
    if (noteChanged) {
      console.log("TextEditor: Note ID changed from", previousNoteIdRef.current, "to", noteId);
      previousNoteIdRef.current = noteId;
    
      if (selectedNote) {
        console.log("TextEditor: Updating content and title for new note:", 
          selectedNote.title,
          "Content length:", selectedNote.content?.length || 0);
          
        // Forzar actualización del estado con una pequeña pausa
        setTimeout(() => {
          setContent(selectedNote.content || "");
          setTitle(selectedNote.title || "");
          setHasChanges(false);
        }, 0);
      } else {
        setContent("");
        setTitle("");
      }
    }
  }, [selectedNote]);

  // Detectar cambios
  useEffect(() => {
    if (!selectedNote) return;
    
    const noteTitleStr = selectedNote.title || "";
    const contentChanged = content !== selectedNote.content;
    const titleChanged = title !== noteTitleStr;
    
    setHasChanges(contentChanged || titleChanged);
    
    if (contentChanged || titleChanged) {
      console.log("TextEditor: Content changed, hasChanges set to true");
    }
  }, [content, title, selectedNote]);

  const handleSave = async () => {
    if (!selectedNote) return;
    
    setIsSaving(true);
    console.log("TextEditor: Saving note...", selectedNote.id);
    
    try {
      await saveNote({
        id: selectedNote.id,
        title: title,
        content: content,
        tradeDate: selectedNote.trade_date
      });
      setHasChanges(false);
      console.log("TextEditor: Note saved successfully");
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Renderizado condicional basado en si hay una nota seleccionada
  if (!selectedNote) {
    console.log("TextEditor: No note selected, showing placeholder");
    return (
      <div className="border border-gray-200 rounded p-4 flex flex-col flex-1 items-center justify-center text-gray-400">
        Selecciona una nota para editar o crea una nueva
      </div>
    );
  }

  // Incluir el ID de la nota en el return para forzar al componente a re-renderizar cuando cambia la nota
  return (
    <div className="border border-gray-200 rounded p-2 flex flex-col flex-1" key={selectedNote.id}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <button className="text-gray-500 hover:text-gray-700" title="Bold">
            <BoldIcon className="w-5 h-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700" title="Italic">
            <ItalicIcon className="w-5 h-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700" title="Underline">
            <UnderlineIcon className="w-5 h-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700" title="Strikethrough">
            <StrikethroughIcon className="w-5 h-5" />
          </button>
        </div>
        
        {hasChanges && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-3 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-400 mb-2">
        Nota: {selectedNote.id.substring(0, 8)}... | Fecha: {selectedNote.trade_date}
      </div>

      {/* Campo de título */}
      <input
        type="text"
        className="mb-2 p-2 border border-gray-200 rounded w-full text-gray-700 focus:outline-none focus:border-indigo-500 text-base font-medium"
        placeholder="Título de la nota"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Textarea para contenido */}
      <textarea
        className="flex-1 resize-none focus:outline-none text-sm text-gray-700 p-2"
        placeholder="Escribe tus notas aquí..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}
