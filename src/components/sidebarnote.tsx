// sidebarnote.tsx
import React from "react";
import {
  PlusIcon,
  TrashIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";

export default function Sidebarnote() {
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
          <NavItem icon={<FolderIcon className="w-4 h-4 text-gray-600" />}>All notes</NavItem>
          <NavItem icon={<FolderIcon className="w-4 h-4 text-gray-600" />}>Trade Notes</NavItem>
          <NavItem icon={<FolderIcon className="w-4 h-4 text-gray-600" />}>Daily Journal</NavItem>
          <NavItem icon={<FolderIcon className="w-4 h-4 text-gray-600" />}>Sessions Recap</NavItem>
          <NavItem icon={<FolderIcon className="w-4 h-4 text-gray-600" />}>Backtesting Session Notes</NavItem>
          <NavItem icon={<FolderIcon className="w-4 h-4 text-gray-600" />}>My notes</NavItem>
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
          <NavItem icon={<TrashIcon className="w-4 h-4 text-gray-600" />}>Recently Deleted</NavItem>
        </div>
      </nav>
    </aside>
  );
}

function NavItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button className="w-full flex items-center space-x-3 py-2 px-3 rounded-md hover:bg-gray-50 text-gray-900 hover:text-indigo-600 transition-colors">
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}