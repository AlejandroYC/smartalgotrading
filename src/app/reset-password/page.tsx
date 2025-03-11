'use client';

import React from 'react';
import ResetPasswordForm from "@/components/ResetPasswordForm";
import Image from 'next/image';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 transition-transform transform hover:scale-105">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/is-iso.webp" // Asegúrate de que la ruta de la imagen sea correcta
              alt="Logo Indices Sinteticos"
              width={61}
              height={54}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recupera Tu Contraseña</h1>
          <p className="text-gray-600">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>
        </div>
        <ResetPasswordForm />
        <div className="text-center mt-4">
          <p className="text-gray-600">
            ¿Aún no tienes una cuenta?{' '}
            <Link href="/signup" className="text-sm text-purple-600 hover:text-purple-700 transition-colors">
              Registrarse 
            </Link>
            <br />
            <Link href="/login" className="text-sm text-purple-600 hover:text-purple-700 transition-colors">
              Iniciar sesión 
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
