'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/providers/AuthProvider';
import { useState } from 'react';

// Crear un evento personalizado para abrir el modal
export const openAddTradeModal = () => {
  const event = new CustomEvent('openAddTradeModal');
  document.dispatchEvent(event);
};

export function Sidebar() {
  const { user, signOut } = useAuthContext();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: '🏠', name: 'Dashboard', href: '/dashboard' },
    { icon: '📊', name: 'Trades', href: '/dashboard/trades' },
    { icon: '📓', name: 'Journal', href: '/dashboard/journal' },
    { icon: '📝', name: 'Notebook', href: '/dashboard/notebook' },
    { icon: '📈', name: 'Reports', href: '/dashboard/reports' },
    { icon: '📚', name: 'Playbooks', href: '/dashboard/playbooks' },
    { icon: '📊', name: 'Progress Tracker', href: '/dashboard/progress', badge: 'Beta' },
    { icon: '🎬', name: 'Trade Replay', href: '/dashboard/replay' },
    { icon: '📚', name: 'Resource Center', href: '/dashboard/resources' },
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
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-[#242b65] to-[#17192b] text-white">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <Image
          src="/logo.png"
          alt="TraderWellll"
          width={40}
          height={40}
          className="mr-2"
        />
        <span className="text-xl font-bold">TraderWell</span>
      </div>

      {/* Add Trade Button */}
      <button 
        onClick={openAddTradeModal}
        className="mx-auto my-3 py-2 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg flex items-center justify-center transition-colors w-4/5">
        <span className="mr-2">+</span>
        <span>Add Trade</span>
      </button>

      {/* Navigation Menu */}
      <nav className="px-4 py-4">
        {menuItems.map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                // Establecer flag para cualquier navegación dentro del dashboard
                if (item.href.startsWith('/dashboard') && !pathname.startsWith(item.href)) {
                  console.log(`⚡ Navegando desde ${pathname} a ${item.href}, estableciendo flag para prevenir recarga`);
                  sessionStorage.setItem('dashboard_internal_navigation', 'true');
                }
              }}
              className={`flex items-center px-4 py-2 rounded-lg mb-2 transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 w-64">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center w-full text-gray-300 hover:bg-white/5 p-2 rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-gray-600 mr-3 flex items-center justify-center">
            {user?.user_metadata?.full_name?.[0] || '?'}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">
              {user?.user_metadata?.full_name || 'User'}
            </div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
        </button>

        {isProfileOpen && (
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
                <button className="p-1 rounded hover:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
