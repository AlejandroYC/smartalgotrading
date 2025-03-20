"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import ReportsSideNav from "../../../components/ReportsSideNav";
import ReportsHeader from "../../../components/ReportsHeader";
import ReportsStats from "../../../components/ReportsStats";
import ReportsCharts from "../../../components/ReportsCharts";
import Days from "../../../components/Days"; // Importa el contenido de Days

export default function ReportsPage() {
  const [selectedSection, setSelectedSection] = useState<string>("default");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header ocupa el 100% de la parte superior */}
      <ReportsHeader />

      {/* Contenedor principal con Sidebar y Contenido */}
      <div className="flex">
        {/* Sidebar con función para cambiar la vista */}
        <ReportsSideNav setSelectedSection={setSelectedSection} />

        {/* Contenido principal cambia dinámicamente */}
        <main className="flex-1 p-6">
          {selectedSection === "days" ? <Days /> : (
            <>
              <ReportsStats />
              <ReportsCharts />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
