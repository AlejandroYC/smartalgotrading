'use client';

import { SignUpForm } from '@/components/SignUpForm';
import Image from 'next/image';


export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-6">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea una cuenta</h1>
          <p className="text-gray-600">Comienza tu jornada de trading con nosotros!</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}