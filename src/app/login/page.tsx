'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import Image from 'next/image';
import { LoadingStyles, FullScreenLoading } from '@/components/LoadingIndicator';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Verificar si el usuario ya está autenticado al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Si ya hay una sesión, redirigir al dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router, supabase.auth]);

  // Función para manejar cuando el form de login comienza a cargar
  const handleLoginStart = () => {
    setLoading(true);
  };

  // Función para manejar cuando el form de login termina de cargar
  const handleLoginEnd = () => {
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-6">
        <LoadingStyles />
        <div className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center bg-gradient-to-br from-blue-100/60 to-purple-200/60">
          <div className="bg-white/90 p-8 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col items-center transform transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 mb-4 relative">
              <LoadingIndicator 
                type="pulse" 
                size="lg" 
                color="secondary" 
              />
            </div>
            <p className="text-purple-800 font-medium text-lg animate-pulse">
              Preparando tu experiencia
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Estamos verificando tu información
              <span className="inline-block animate-bounce text-purple-500 ml-1">.</span>
              <span className="inline-block animate-bounce text-purple-500 ml-0.5 animation-delay-100">.</span>
              <span className="inline-block animate-bounce text-purple-500 ml-0.5 animation-delay-200">.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-6">
      <LoadingStyles />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 transition-transform transform hover:scale-105">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <Image
                          src="is-iso.webp" 
                          alt="Logo Indices Sinteticos"
                          width={61}
                          height={54}
                          
                        />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-gray-600">¡Ayudamos a traders para que sean rentables!
          </p>
        </div>
        <LoginForm onLoadingStart={handleLoginStart} onLoadingEnd={handleLoginEnd} />
      </div>
    </div>
  );
} 