import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : error.message
      );
    }

    return data;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data?.user?.identities?.length === 0) {
      throw new Error('Este email ya está registrado.');
    }

    return data;
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Limpiar estado local primero
      setSession(null);
      setUser(null);
      
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        // Limpiar todos los datos relacionados con Supabase
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth.') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Intentar hacer logout en Supabase, pero no esperar por su resultado
      supabase.auth.signOut().catch(e => {
        console.log('Error en signOut de Supabase (ignorado):', e);
      });
      
      // Redirigir inmediatamente sin esperar respuesta
      router.push('/login');
      
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    user, 
    session, 
    signIn, 
    signUp, 
    signOut,
    isLoading 
  };
}; 