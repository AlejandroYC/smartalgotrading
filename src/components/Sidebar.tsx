'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/providers/AuthProvider';
import { useSidebar } from '@/contexts/SidebarContext';
import { useState } from 'react';
// Importar iconos de React Icons
import { MdDashboard, MdInsertChart, MdBook, MdPlayArrow, MdEmail } from 'react-icons/md';
import { FaFileAlt, FaChartLine, FaListAlt, FaChartBar } from 'react-icons/fa';

// Crear un evento personalizado para abrir el modal
export const openAddTradeModal = () => {
  const event = new CustomEvent('openAddTradeModal');
  document.dispatchEvent(event);
};

export function Sidebar() {
  const { user, signOut } = useAuthContext();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { 
      icon: <MdDashboard size={20} color="#9ca3af" />, 
      name: 'Panel', 
      href: '/dashboard' 
    },
    { 
      icon: <FaListAlt size={20} color="#9ca3af" />, 
      name: 'Diario ', 
      href: '/dashboard/journal' 
    },
    { 
      icon: <FaFileAlt size={20} color="#9ca3af" />, 
      name: 'Trades', 
      href: '/dashboard/trades' 
    },
    { 
      icon: <MdBook size={20} color="#9ca3af" />, 
      name: 'Notebook', 
      href: '/dashboard/notebook' 
    },
    { 
      icon: <FaChartBar size={20} color="#9ca3af" />, 
      name: 'Reports', 
      href: '/dashboard/reports' 
    },
    { 
      icon: <MdBook size={20} color="#9ca3af" />, 
      name: 'Playbooks', 
      href: '/dashboard/playbooks' 
    },
    { 
      icon: <FaChartLine size={20} color="#9ca3af" />, 
      name: 'Progress Tracker', 
      href: '/dashboard/progress', 
      badge: 'Beta' 
    },
    { 
      icon: <MdPlayArrow size={20} color="#9ca3af" />, 
      name: 'Trade Replay', 
      href: '/dashboard/replay' 
    },
    { 
      icon: <MdInsertChart size={20} color="#9ca3af" />, 
      name: 'Resource Center', 
      href: '/dashboard/resources' 
    },
  ];

  // Función mejorada para manejar el logout
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevenir múltiples clics
    
    try {
      setIsLoggingOut(true);
      console.log('Sidebar: iniciando logout');
      
      // Cerrar el menú de perfil
      setIsProfileOpen(false);
      
      // Ejecutar el proceso de logout
      await signOut();
      
    } catch (error) {
      console.error('Error en logout desde Sidebar:', error);
      // No necesitamos restablecer isLoggingOut ya que la página se recargará
    }
  };

  // Función simple para verificar si un ítem está activo
  const isItemActive = (href: string) => {
    // Para dashboard, solo coincide si es exactamente /dashboard
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    
    // Para el resto, verificamos si la ruta actual comienza con la URL del ítem
    return pathname?.startsWith(href) || false;
  };

  return (
    <div className={`h-screen bg-gradient-to-t from-[#242b65] to-[#17192b] text-white transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-[217px]'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-[#17192b] rounded-full p-1.5 text-white hover:bg-opacity-80 transition-colors z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Logo */}
      <div className={`py-4 px-5 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <Image
          src="/lmc_trade_logo.webp"
          alt="Logo LMC Trade"
          width={160}
          height={36}
          className="min-w-[32px]"
        />
       
      </div>

      {/* Add Trade Button */}
      <button 
        onClick={openAddTradeModal}
        className={`mx-auto my-4 bg-[#7C3AED] rounded-md flex items-center justify-center transition-all ${
          isCollapsed ? 'w-10 h-10' : 'w-[calc(100%-40px)] h-10'
        }`}
      >
        <span className={`text-white ${isCollapsed ? 'text-lg' : 'text-lg'} font-medium`}>+</span>
        <span className={`ml-2 text-white font-medium transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
          Add Trade
        </span>
      </button>

      {/* Navigation Menu */}
      <nav className="px-3">
        {menuItems.map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (item.href.startsWith('/dashboard') && pathname && !pathname.startsWith(item.href)) {
                  sessionStorage.setItem('dashboard_internal_navigation', 'true');
                }
              }}
              className={`flex items-center px-2 py-2.5 rounded-md mb-1 transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title={isCollapsed ? item.name : ''}
            >
              <span className={`flex items-center justify-center w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
              <span className={`text-sm transition-opacity mb-2 duration-300 font-roboto ${isCollapsed ? 'hidden' : 'block'}`}>
                {item.name}
              </span>
              {item.badge && !isCollapsed && (
                <span className="ml-auto text-[10px] font-medium bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={`absolute bottom-0 left-0 right-0  ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={() => !isCollapsed && setIsProfileOpen(!isProfileOpen)}
          className={`flex items-center text-gray-300 hover:bg-white/5 p-2 rounded-lg ${isCollapsed ? 'justify-center' : 'w-full'}`}
        >
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center min-w-[32px]">
            {user?.user_metadata?.full_name?.[0] || '?'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left ml-3">
              <div className="text-sm font-medium">
                {user?.user_metadata?.full_name || 'User'}
              </div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
          )}
        </button>

        {isProfileOpen && !isCollapsed && (
          <div className="mt-2 py-2 bg-gray-800 rounded-lg shadow-lg">
            {/* Theme Selector */}
            <div className="px-4 py-2 border-b border-gray-700">
              <div className="text-white text-sm font-medium">Theme</div>
              <div className="flex items-center gap-2 mt-1">
                <button className="p-1 rounded hover:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
                <button className="p-1 rounded hover:bg-gray-700 ">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 !text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <Link href="/help" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              Help
            </Link>
            
            <Link href="/changelog" className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <span>Changelog</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            
            <Link href="/community" className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <span>Community</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            
            <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              Settings
            </Link>
            
            <div className="border-t border-gray-700 mt-1"></div>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`block w-full text-left px-4 py-2 text-sm ${
                isLoggingOut ? 'text-gray-500' : 'text-red-500 hover:bg-gray-700'
              }`}
            >
              {isLoggingOut ? 'Saliendo...' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
