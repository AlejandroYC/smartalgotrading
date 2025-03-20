// TextEditor.tsx
import React, { useState } from "react";
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon } from "../components/icons";

export default function TextEditor() {
  const [content, setContent] = useState("");

  return (
    <div className="border border-gray-200 rounded p-2 flex flex-col flex-1">
      {/* Toolbar */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 mb-2">
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

      {/* Textarea */}
      <textarea
        className="flex-1 resize-none focus:outline-none text-sm text-gray-700"
        placeholder="Enter some notes..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}
