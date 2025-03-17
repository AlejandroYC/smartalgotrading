import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LoadingStyles } from "@/components/LoadingIndicator";
import { AuthProvider } from "@/providers/AuthProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Indices Sinteticos",
  description: "A clone of TradeZella for learning purposes",
  icons: {
    icon: "favicon_is.webp",  // Ruta al archivo de favicon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LoadingStyles />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
