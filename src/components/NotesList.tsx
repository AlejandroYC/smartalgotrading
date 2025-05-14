// NotesList.tsx
import React, { useState, useEffect, useRef } from "react";
import { format, parseISO } from 'date-fns';
import { JournalNote, useNotebook } from "@/hooks/useNotebook";
import { LoadingIndicator } from "./LoadingIndicator";

export default function NotesList() {
  const { 
    filteredNotes, 
    loading, 
    setSelectedNote, 
    selectedNote, 
    createQuickNote,
    error
  } = useNotebook();
  const [creatingNote, setCreatingNote] = useState(false);
  const selectedNoteIdRef = useRef<string | null>(null);
  const clickCountRef = useRef(0);

  // Ordenar notas por fecha (más recientes primero)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    return new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime();
  });

  // Log cuando cambia selectedNote
  useEffect(() => {
    console.log("NotesList: selected note changed to", 
      selectedNote?.id || "null", 
      selectedNote?.title || "no title"
    );
    
    if (selectedNote?.id !== selectedNoteIdRef.current) {
      console.log("NotesList: updating selection ref from", 
        selectedNoteIdRef.current, 
        "to", 
        selectedNote?.id || "null"
      );
      selectedNoteIdRef.current = selectedNote?.id || null;
    }
  }, [selectedNote]);

  // Manejar la creación de una nota rápida
  const handleLogDay = async () => {
    if (creatingNote) return; // Evitar múltiples clics

    try {
      setCreatingNote(true);
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      
      // Verificar si ya existe una nota para hoy
      const existingNote = filteredNotes.find(note => note.trade_date === formattedDate);
      
      if (existingNote) {
        // Si ya existe, seleccionarla
        console.log("NotesList: Selecting existing note for today:", existingNote.id);
        // Crear una copia profunda para evitar problemas de referencia
        const noteCopy = JSON.parse(JSON.stringify(existingNote));
        setSelectedNote(noteCopy);
        selectedNoteIdRef.current = existingNote.id;
      } else {
        // Si no existe, crear una nueva
        console.log("NotesList: Creating new note for today");
        const newNote = await createQuickNote(
          `Nota del ${format(today, 'dd/MM/yyyy')}`,
          ''
        );
        
        if (newNote) {
          console.log("NotesList: New note created, selecting:", newNote.id);
          setSelectedNote(newNote);
          selectedNoteIdRef.current = newNote.id;
        }
      }
    } catch (error) {
      console.error('Error creando nota rápida:', error);
    } finally {
      setCreatingNote(false);
    }
  };

  // Log para depuración
  useEffect(() => {
    console.log("NotesList - Current state:", { 
      notesCount: sortedNotes.length,
      selectedNote: selectedNote?.id,
      selectedNoteRef: selectedNoteIdRef.current,
      error
    });
  }, [sortedNotes, selectedNote, error]);

  // Función para manejar clic en una nota - VERSIÓN SIMPLIFICADA
  const handleNoteClick = (note: JournalNote) => {
    // Incrementar el contador de clics para depuración
    clickCountRef.current += 1;
    const clickId = clickCountRef.current;
    
    console.log(`NotesList: Clic #${clickId} en nota:`, note.id, note.title, note.trade_date);
    
    // Si ya está seleccionada esta nota, no volver a seleccionarla
    if (selectedNote?.id === note.id && selectedNoteIdRef.current === note.id) {
      console.log(`NotesList: Clic #${clickId} - Nota ya seleccionada:`, note.id);
      return; // Importante: no volver a seleccionar para evitar renders adicionales
    }
    
    // Crear una copia profunda pero sin timestamp dinámico
    const noteCopy = JSON.parse(JSON.stringify(note));
    
    // Actualizar la referencia para UX
    selectedNoteIdRef.current = note.id;
    
    // Establecer la nota seleccionada
    console.log(`NotesList: Clic #${clickId} - Seleccionando nota:`, noteCopy.id);
    setSelectedNote(noteCopy);
  };

  // Función para renderizar cada elemento de la lista
  const renderNoteItem = (note: JournalNote) => {
    const isSelected = selectedNote?.id === note.id;
    return (
      <NoteListItem 
        key={note.id} 
        note={note} 
        isSelected={isSelected}
        onClick={() => handleNoteClick(note)} 
      />
    );
  };

  return (
    <aside className="w-64 border border-gray-200 bg-white flex flex-col 
                     shadow-[-4px_0_12px_rgba(0,0,0,0.12)] 
                     mr-5 
                     rounded-tl-lg">
      {/* Barra superior: Log day button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button 
          className={`
            bg-indigo-500 text-white px-3 py-1.5 rounded-md text-sm font-medium
            hover:bg-indigo-600 transition-colors
            ${creatingNote ? 'opacity-75 cursor-wait' : ''}
          `}
          onClick={handleLogDay}
          disabled={creatingNote}
        >
          {creatingNote ? (
            <span className="flex items-center">
              <LoadingIndicator size="xs" color="primary" className="mr-1" /> 
              Creando...
            </span>
          ) : (
            'Log day'
          )}
        </button>
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-400 p-2 border-b border-gray-200">
        Selected: {selectedNoteIdRef.current?.substring(0, 8) || 'none'} | 
        Clics: {clickCountRef.current}
      </div>

      {/* Lista de notas */}
      <div className="flex-1 overflow-auto text-sm">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingIndicator size="sm" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        ) : sortedNotes.length > 0 ? (
          sortedNotes.map(renderNoteItem)
        ) : (
          <div className="p-4 text-center text-gray-500">
            No hay notas disponibles en esta carpeta
          </div>
        )}
      </div>
    </aside>
  );
}

function NoteListItem({ note, isSelected, onClick }: { 
  note: JournalNote, 
  isSelected: boolean,
  onClick: () => void 
}) {
  const formattedDate = format(parseISO(note.trade_date), 'EEE, MMM dd, yyyy');
  
  return (
    <button 
      className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex flex-col
                ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
      onClick={onClick}
    >
      <span className="font-semibold text-gray-800">{formattedDate}</span>
      <span className="text-xs text-gray-700 truncate">{note.title || 'Sin título'}</span>
      <span className="text-xs text-gray-400">ID: {note.id.substring(0, 8)}...</span>
    </button>
  );
}
