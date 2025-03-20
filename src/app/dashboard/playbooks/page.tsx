"use client";
export const dynamic = 'force-dynamic';

import React, { Suspense } from "react";
import PlaybookHeader from "../../../components/PlaybookHeader";
import PlaybookSubnav from "../../../components/PlaybookSubnav";
import PlaybookMain from "../../../components/PlaybookMain";

export default function PlaybookPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC]">
      {/* Encabezado */}
      <Suspense fallback={<div className="p-4">Loading header...</div>}>
        <PlaybookHeader />
      </Suspense>

      {/* Subnavegación */}
      <Suspense fallback={<div className="p-4">Loading navigation...</div>}>
        <PlaybookSubnav />
      </Suspense>

      {/* Contenido principal */}
      <Suspense fallback={<div className="p-4">Loading content...</div>}>
        <PlaybookMain />
      </Suspense>
    </div>
  );
}
