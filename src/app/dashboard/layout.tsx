'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AddTradeModal from '@/components/AddTradeModal';
import { Sidebar } from '@/components/Sidebar';
import SecondSidebar from '@/components/SecondSidebar';
import { TradingDataProvider } from '@/contexts/TradingDataContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { HangTightLoading } from '@/components/HangTightLoading';

// Componente para manejar la carga de navegación
function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();
  const [isNavigating, setIsNavigating] = useState(false);
  const [prevPathname, setPrevPathname] = useState("");

  useEffect(() => {
    if (!prevPathname) {
      setPrevPathname(pathname);
      return;
    }

    if (pathname !== prevPathname) {
      if ((pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && 
          !prevPathname.startsWith('/dashboard')) {
        sessionStorage.setItem('dashboard_internal_navigation', 'true');
      } 
      else if (pathname.startsWith('/dashboard/') && prevPathname.startsWith('/dashboard/')) {
        sessionStorage.setItem('dashboard_internal_navigation', 'true');
      }
      
      setIsNavigating(true);
      
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setPrevPathname(pathname);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, prevPathname]);

  if (!isNavigating) return null;

  return (
    <div className={`absolute top-0 right-0 bottom-0 transition-all duration-300 ${isCollapsed ? 'left-[104px]' : 'left-80'} z-40`}>
      <HangTightLoading 
        message="Cargando" 
        description="Preparando contenido" 
        fullScreen={false}
      />
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const openModal = () => setIsModalOpen(true);
    document.addEventListener('openAddTradeModal', openModal);
    return () => {
      document.removeEventListener('openAddTradeModal', openModal);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen bg-white">
        <div className="flex fixed left-0 z-50">
          <SecondSidebar />
          <Sidebar />
        </div>
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-[140px]' : 'ml-80'} relative`}>
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
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TradingDataProvider>
      <SidebarProvider>
        <DashboardContent>
          {children}
        </DashboardContent>
      </SidebarProvider>
    </TradingDataProvider>
  );
} 