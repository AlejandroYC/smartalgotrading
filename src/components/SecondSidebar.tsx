import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/providers/AuthProvider';

const SecondSidebar = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuthContext();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      console.log('SecondSidebar: iniciando logout');
      
      setIsProfileMenuOpen(false);
      
      await signOut();
      
    } catch (error) {
      console.error('Error en logout desde SecondSidebar:', error);
    }
  };

  return (
    <div className="w-16 h-screen bg-gradient-to-b from-[#242b65] to-[#17192b] border-r border-gray-700 flex flex-col items-center py-4">
      <div className="flex flex-col space-y-6">
        {/* Ícono de micrófono */}
        <button className="p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Ícono de auriculares */}
        <button className="p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>

        {/* Ícono de ventanas */}
        <button className="p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </button>

        {/* Ícono de graduación */}
        <button className="p-3 rounded-lg hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          </svg>
        </button>
      </div>

      {/* Ícono de perfil con menú desplegable */}
      <div className="mt-auto mb-4 relative">
        <button 
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="p-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {/* Menú desplegable */}
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-16 mb-2 w-48 bg-[#242b65] rounded-lg shadow-lg py-2 border border-gray-700">
            <div className="px-4 py-2 border-b border-gray-700">
              <div className="text-white font-medium">Theme</div>
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
            <Link href="/help" className="px-4 py-2 text-gray-400 hover:bg-gray-700 block">
              Help
            </Link>
            <Link href="/changelog" className="px-4 py-2 text-gray-400 hover:bg-gray-700 block">
              Changelog
            </Link>
            <Link href="/community" className="px-4 py-2 text-gray-400 hover:bg-gray-700 block">
              Community
            </Link>
            <Link href="/settings" className="px-4 py-2 text-gray-400 hover:bg-gray-700 block">
              Settings
            </Link>
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`px-4 py-2 text-red-500 hover:bg-gray-700 block w-full text-left ${
                isLoggingOut ? 'text-gray-500' : ''
              }`}
            >
              {isLoggingOut ? 'Saliendo...' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondSidebar; 