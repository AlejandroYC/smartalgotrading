import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { LoadingStyles } from "@/components/LoadingIndicator";
import type { Metadata } from "next";
import { AccountProvider } from '@/contexts/AccountContext';
import { Suspense } from 'react';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMC Trade",
  description: "Plataforma de algoritmos de trading",
  icons: {
    icon: "favicon_is.webp",  // Ruta al archivo de favicon
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-300`}>
        <LoadingStyles />
        <AuthProvider>
          <AccountProvider>
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
          </AccountProvider>
          <ToastContainer 
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
