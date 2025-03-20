'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AddTradeModal from '@/components/AddTradeModal';
import { Sidebar } from '@/components/Sidebar';
import SecondSidebar from '@/components/SecondSidebar';
import { TradingDataProvider } from '@/contexts/TradingDataContext';
import { HangTightLoading } from '@/components/HangTightLoading';

// Componente para manejar la carga de navegación
function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [prevPathname, setPrevPathname] = useState("");

  useEffect(() => {
    // Al iniciar, guardar la ruta actual
    if (!prevPathname) {
      setPrevPathname(pathname);
      return;
    }

    // Si la ruta ha cambiado, mostrar el indicador de carga
    if (pathname !== prevPathname) {
      // Si estamos navegando HACIA el dashboard desde otra página
      if ((pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && 
          !prevPathname.startsWith('/dashboard')) {
        // Establecer flag para prevenir recarga innecesaria
        sessionStorage.setItem('dashboard_internal_navigation', 'true');
        console.log(`🧭 Navegación EXTERNA al dashboard: ${prevPathname} -> ${pathname}`);
      } 
      // También establecer el flag para navegación entre secciones del dashboard
      else if (pathname.startsWith('/dashboard/') && prevPathname.startsWith('/dashboard/')) {
        // Navegando entre secciones internas
        sessionStorage.setItem('dashboard_internal_navigation', 'true');
        console.log(`🧭 Navegación INTERNA del dashboard: ${prevPathname} -> ${pathname}`);
      }
      
      setIsNavigating(true);
      
      // Simular un tiempo mínimo de carga para evitar parpadeos
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setPrevPathname(pathname);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, prevPathname]);

  if (!isNavigating) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 left-80 z-40">
      <HangTightLoading 
        message="Cargando" 
        description="Preparando contenido" 
        fullScreen={false}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Escuchar el evento personalizado para abrir el modal
  useEffect(() => {
    const openModal = () => setIsModalOpen(true);
    document.addEventListener('openAddTradeModal', openModal);
    
    // Limpiar el event listener al desmontar el componente
    return () => {
      document.removeEventListener('openAddTradeModal', openModal);
    };
  }, []);

  return (
    <TradingDataProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen bg-white">
          <div className="flex fixed left-0 z-50">
            <SecondSidebar />
            <Sidebar />
          </div>
          <div className="flex-1 ml-80 relative">
            <NavigationLoading />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
        
        <AddTradeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </TradingDataProvider>
  );
} 