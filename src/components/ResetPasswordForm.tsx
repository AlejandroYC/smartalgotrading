'use client';

import { useState } from 'react';
import { supabase } from '../lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/new-password`,
      });

      if (error) throw error;

      setMessage('Te hemos enviado un correo con las instrucciones para restablecer tu contraseña.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Error al solicitar restablecimiento:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg p-3">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresa tu correo electrónico"
          className="w-full px-4 py-3 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>
      </form>

      <div className="text-center mt-4">
        <Link
          href="/login"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
