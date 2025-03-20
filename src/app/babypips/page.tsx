'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import BabypipsTopBar from '../../components/BabypipsTopBar';
import BabypipsNavBar from '../../components/BabypipsNavBar';
import BabypipsHero from '../../components/BabypipsHeroSection';
import BabypipsSection1 from '../../components/BabypipsSection1';
import BabypipsFooter from '../../components/BabypipsFooter';
import BabypipsRightSidebar from '../../components/BabypipsRightSidebar';
import FeaturedLessons from '../../components/FeaturedLessons';
import InspirationQuote from '../../components/InspirationQuote'; // Nueva importación

// IMPORTA EL NUEVO COMPONENTE DE FORMA DINÁMICA PARA EVITAR PROBLEMAS DE SSR
const ForumAndCalendarSection = dynamic(() => import('../../components/ForumAndCalendarSection'), { ssr: false });

const BabypipsFullPage: React.FC = () => {
  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      {/* Top Bar + Nav */}
      <BabypipsNavBar />
      <BabypipsTopBar />

      {/* Contenido principal */}
      <main className="flex-grow">
        {/* Hero a pantalla completa */}
        <BabypipsHero />

        {/* Contenedor de 2 columnas */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
          {/* Columna izquierda */}
          <div className="w-full md:w-2/3 space-y-6">
            <BabypipsSection1 />
          </div>

          {/* Columna derecha (sidebar) */}
          <div className="w-full md:w-1/3">
            <BabypipsRightSidebar />
          </div>
        </div>

        {/* Sección Forum y Calendar */}
        <div className="min-h-[200px] bg-white border border-blue-500">
          <ForumAndCalendarSection />
        </div>

        {/* Sección Featured Lessons */}
        <FeaturedLessons />

        {/* Nueva cita inspiracional agregada aquí */}
        <InspirationQuote />
        
      </main>

      {/* Footer */}
      <BabypipsFooter />
    </div>
  );
};

export default BabypipsFullPage;