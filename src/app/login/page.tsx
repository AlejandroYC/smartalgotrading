'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import Image from 'next/image';
import { LoadingStyles, FullScreenLoading } from '@/components/LoadingIndicator';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function LoginPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Verificar si el usuario ya está autenticado al cargar la página
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        // Usar sesión cacheada para reducir latencia
        const { data } = await supabase.auth.getSession();
        
        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          if (data.session) {
            // Si ya hay una sesión, redirigir al dashboard inmediatamente
            console.log('[LoginPage] Sesión existente detectada, redirigiendo...');
            
            // Marcar que venimos del login para evitar doble loading
            sessionStorage.setItem('coming_from_login', 'true');
            
            // Forzar navegación con reemplazo para evitar problemas con la historia del navegador
            router.replace('/dashboard');
          } else {
            // Sin sesión, mostrar formulario de login
            setInitialLoading(false);
          }
        }
      } catch (error) {
        console.error('[LoginPage] Error al verificar sesión:', error);
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    checkSession();
    
    // Limpiar en desmontaje
    return () => {
      isMounted = false;
    };
  }, [router, supabase.auth]);

  // Función para manejar cuando el form de login comienza a cargar
  const handleLoginStart = () => {
    setFormLoading(true);
  };

  // Función para manejar cuando el form de login termina de cargar
  const handleLoginEnd = () => {
    setFormLoading(false);
  };

  // Mostrar pantalla de carga durante verificación inicial
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-6">
        <LoadingStyles />
        <div className="bg-white/90 p-8 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col items-center">
          <div className="w-16 h-16 mb-4 relative">
            <LoadingIndicator 
              type="pulse" 
              size="lg" 
              color="secondary" 
            />
          </div>
          <p className="text-purple-800 font-medium text-lg">
            Cargando
          </p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de carga durante proceso de login
  if (formLoading) {
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

  // Formulario de login
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
          <p className="text-gray-600">¡Ayudamos a traders para que sean rentables!</p>
        </div>
        <LoginForm onLoadingStart={handleLoginStart} onLoadingEnd={handleLoginEnd} />
      </div>
    </div>
  );
} 