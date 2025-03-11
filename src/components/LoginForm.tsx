'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard'); // O donde quieras redirigir después del login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ingresar');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

     

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-purple-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">✦</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo Electronico"
            required
            className="w-full px-4 py-3 border border-gray-300  text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full px-4 py-3 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
          />
          <div className="text-right mt-2">
            <Link
              href="/reset-password"
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Olvidaste la contraseña?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in...' : 'Ingresar'}
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
    </div>
  );
} 