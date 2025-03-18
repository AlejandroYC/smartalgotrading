// ChatBubble.tsx
import React from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export default function ChatBubble() {
  return (
    <button
      className="fixed bottom-6 right-6 bg-indigo-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700"
      title="Chat / Help"
    >
      <PencilSquareIcon className="w-6 h-6" />
    </button>
  );
}
