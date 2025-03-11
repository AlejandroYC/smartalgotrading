'use client';
import React from 'react';
import NewPasswordForm from '../../components/NewPasswordForm'; // Asegúrate de que la ruta sea correcta
import Image from 'next/image'; // Si deseas agregar una imagen como el diseño original

const NewPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 transition-transform transform hover:scale-105">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/is-iso.webp" // Asegúrate de que la ruta de la imagen esté correcta
              alt="Logo Indices Sinteticos"
              width={61}
              height={54}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restablecer Contraseña</h1>
          <p className="text-gray-600">Recupera tu acceso a la cuenta.</p>
        </div>
        <NewPasswordForm />
      </div>
    </div>
  );
};

export default NewPasswordPage;
