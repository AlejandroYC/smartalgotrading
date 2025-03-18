'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/providers/AuthProvider';
import Link from 'next/link';
import { LoadingIndicator } from './LoadingIndicator';
import { toast } from 'react-toastify';

interface LoginFormProps {
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
}

export function LoginForm({ onLoadingStart, onLoadingEnd }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isSubmitting = useRef(false);
  const formSubmitCount = useRef(0);
  const loginTimeout = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { signIn } = useAuthContext();

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (loginTimeout.current) {
        clearTimeout(loginTimeout.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Función para mostrar mensajes de error de forma segura
  const showError = (message: string) => {
    console.log('[LoginForm] Mostrando error:', message);
    
    // Mostrar error en el componente
    setError(message);
    
    // También mostrar como toast para mayor visibilidad
    toast.error(message, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    
    // Desactivar el estado de carga
    setLoading(false);
    isSubmitting.current = false;
    
    // Notificar al componente padre que ha terminado la carga
    onLoadingEnd?.();
    
    // Auto limpiar el error después de 8 segundos
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, 8000);
  };

  // Función para alternar la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar cualquier mensaje de error previo
    setError(null);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    // Prevenir múltiples envíos simultáneos
    if (isSubmitting.current || loading) {
      console.log('[LoginForm] Evitando múltiples envíos del formulario');
      return;
    }
    
    // Validación básica del formulario
    if (!email || !password) {
      showError('Por favor, completa todos los campos');
      return;
    }
    
    // Verificar envíos rápidos consecutivos
    formSubmitCount.current += 1;
    if (formSubmitCount.current > 3) {
      showError('Demasiados intentos. Por favor, espera un momento antes de intentar nuevamente.');
      
      // Reiniciar el contador después de 10 segundos
      loginTimeout.current = setTimeout(() => {
        formSubmitCount.current = 0;
      }, 10000);
      
      return;
    }

    // Iniciar proceso de login
    setLoading(true);
    isSubmitting.current = true;
    onLoadingStart?.(); // Notificar al componente padre que ha comenzado la carga

    try {
      console.log('[LoginForm] Iniciando proceso de login');
      await signIn(email, password);
      console.log('[LoginForm] Login exitoso, redirigiendo inmediatamente...');
      
      // Marcar que venimos del login para evitar doble loading
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('coming_from_login', 'true');
      }
      
      // Redireccionar inmediatamente al dashboard
      router.push('/dashboard');
      
      // Mostrar mensaje de éxito como toast (aparecerá después de la redirección)
      toast.success('¡Inicio de sesión exitoso!', {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (err: any) {
      console.error('[LoginForm] Error durante login:', err);
      
      // Obtener el mensaje de error para mostrar al usuario
      let errorMessage = 'Error al ingresar. Por favor, verifica tus credenciales.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Mostrar error al usuario de forma segura
      showError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-purple-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">✦</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo Electronico"
            required
            className={`w-full px-4 py-3 border ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'} text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all`}
            disabled={loading || isSubmitting.current}
          />
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className={`w-full px-4 py-3 border ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'} text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all`}
              disabled={loading || isSubmitting.current}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" 
                    clipRule="evenodd" 
                  />
                  <path
                    d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="text-right mt-2">
            <Link
              href="/reset-password"
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Olvidaste la contraseña?
            </Link>
          </div>
        </div>

        {/* Mensaje de error más visible y colocado justo antes del botón */}
        {error && (
          <div className="my-3 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm animate-bounce-once">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="font-medium text-sm">{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isSubmitting.current}
          className={`
            w-full py-3 rounded-lg 
            transition-all duration-300
            flex items-center justify-center relative
            ${loading || isSubmitting.current
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-inner text-white/90 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-500 to-purple-700 shadow-md hover:shadow-lg text-white hover:from-purple-600 hover:to-purple-800'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center">
              <LoadingIndicator 
                type="dots" 
                size="xs" 
                color="secondary" 
                className="mr-3"
              />
              <span className="font-medium animate-pulse">Accediendo</span>
            </div>
          ) : (
            <span className="font-medium">Ingresar</span>
          )}
        </button>
      </form>

      <p className="text-center text-gray-600">
        Aun no tienes una cuenta?{' '}
        <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
          Registrate
        </Link>
        <br />
        <br />
        <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
        Volver al inicio
        </Link>
      </p>

      {/* Agregar estilo CSS para la animación bounce-once */}
      <style jsx global>{`
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
} 