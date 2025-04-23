"use client";
export const dynamic = "force-dynamic";

import React, { Suspense, useState } from "react";
import PlaybookHeader from "../../../components/PlaybookHeader";
import PlaybookSubnav from "../../../components/PlaybookSubnav";
import MyPlaybook from "../../../components/MyPlaybook";
import SharedPlaybook from "../../../components/SharedPlaybook";
import TemplatesPlaybook from "../../../components/TemplatesPlaybook";

export default function PlaybookPage() {
  const [activeTab, setActiveTab] = useState<"my" | "shared" | "templates">("my");

  const renderContent = () => {
    switch (activeTab) {
      case "shared":
        return <SharedPlaybook />;
      case "templates":
        return <TemplatesPlaybook />;
      case "my":
      default:
        return <MyPlaybook />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC]">
      {/* Encabezado */}
      <Suspense fallback={<div className="p-4">Loading header...</div>}>
        <PlaybookHeader />
      </Suspense>

      {/* Subnavegación */}
      <Suspense fallback={<div className="p-4">Loading navigation...</div>}>
        <PlaybookSubnav setActiveTab={setActiveTab} activeTab={activeTab} />
      </Suspense>

      {/* Contenido principal dinámico */}
      <Suspense fallback={<div className="p-4">Loading content...</div>}>
        {renderContent()}
      </Suspense>
    </div>
  );
}
