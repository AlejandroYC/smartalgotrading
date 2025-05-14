// sidebarnote.tsx
import React from "react";
import { useNotebook } from "@/hooks/useNotebook";
import {
  PlusIcon,
  TrashIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";

export default function Sidebarnote() {
  const { notes, activeFolder, setActiveFolder } = useNotebook();

  // Determinar las carpetas disponibles según las notas existentes
  const getAvailableFolders = () => {
    const folders = new Set<string>();
    
    // Agregar carpetas basadas en el mes/año de la nota
    notes.forEach(note => {
      try {
        const date = new Date(note.trade_date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        folders.add(monthYear);
      } catch (e) {
        // Ignorar errores de fecha
      }
    });
    
    return Array.from(folders).sort();
  };

  const handleFolderClick = (folder: string | null) => {
    setActiveFolder(folder);
  };

  const availableFolders = getAvailableFolders();

  return (
    <aside className="bg-white flex flex-col rounded-t-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] mr-5 border border-gray-200">
      {/* Botón "Add folder" */}
      <div className="p-4 border-b border-gray-200 rounded-t-lg"> 
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors w-full justify-center shadow-sm">
          <PlusIcon className="w-4 h-4 stroke-[2.5]" />
          <span>Add folder</span>
        </button>
      </div>

      {/* Secciones */}
      <nav className="flex-1 overflow-auto p-2 text-gray-700 space-y-1 text-sm">
        <div className="border-b border-gray-200 pb-2">
          <div className="px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Folders
          </div>
          <NavItem 
            icon={<FolderIcon className="w-4 h-4 text-gray-600" />}
            active={activeFolder === "all"}
            onClick={() => handleFolderClick("all")}
          >
            All notes ({notes.length})
          </NavItem>
          <NavItem 
            icon={<FolderIcon className="w-4 h-4 text-gray-600" />}
            active={activeFolder === "trade"}
            onClick={() => handleFolderClick("trade")}
          >
            Trade Notes
          </NavItem>
          <NavItem 
            icon={<FolderIcon className="w-4 h-4 text-gray-600" />}
            active={activeFolder === "daily"}
            onClick={() => handleFolderClick("daily")}
          >
            Daily Journal
          </NavItem>
          
          {/* Mostrar carpetas basadas en mes/año */}
          {availableFolders.map(folder => (
            <NavItem 
              key={folder}
              icon={<FolderIcon className="w-4 h-4 text-gray-600" />}
              active={activeFolder === folder}
              onClick={() => handleFolderClick(folder)}
            >
              {folder}
            </NavItem>
          ))}
        </div>

        <div className="border-b border-gray-200 pb-2 mt-2">
          <div className="px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tags
          </div>
        </div>

        <div className="mt-2">
          <div className="px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recently Deleted
          </div>
          <NavItem 
            icon={<TrashIcon className="w-4 h-4 text-gray-600" />}
            active={activeFolder === "deleted"}
            onClick={() => handleFolderClick("deleted")}
          >
            Recently Deleted
          </NavItem>
        </div>
      </nav>
    </aside>
  );
}

function NavItem({
  icon,
  children,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      className={`w-full flex items-center space-x-3 py-2 px-3 rounded-md hover:bg-gray-50 
                 ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'} 
                 transition-colors`}
      onClick={onClick}
    >
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}