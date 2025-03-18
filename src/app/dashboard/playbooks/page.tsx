"use client";

import React from "react";
import PlaybookHeader from "../../../components/PlaybookHeader";
import PlaybookSubnav from "../../../components/PlaybookSubnav";
import PlaybookMain from "../../../components/PlaybookMain";

export default function PlaybookPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC]">
      {/* Encabezado */}
      <PlaybookHeader />

      {/* Subnavegación */}
      <PlaybookSubnav />

      {/* Contenido principal */}
      <PlaybookMain />
    </div>
  );
}
