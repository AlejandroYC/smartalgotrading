'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      await signUp(email, password, fullName);
      setMessage('¡Revisa tu email para confirmar tu cuenta! Si no lo encuentras, revisa tu carpeta de spam.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Error en el registro:', error);
      setMessage(error instanceof Error ? error.message : 'Error durante el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`border text-sm rounded-lg p-3 ${
          message.includes('Revisa') ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            Nombre Completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          placeholder="Registrarse"
         >
          
          {loading ? 'Creating account...' : 'Registrate'}
        </button>
      </form>

      <p className="text-center text-gray-600">
      ¿Ya tienes una cuenta?{' '}
        <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
        Inicia sesión
        </Link>
        <br />
        <br />
        <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
        Volver al inicio
        </Link>
      </p>
    </div>
  );
} 