// Este archivo no se está utilizando ya que el proyecto usa Supabase para autenticación
// Comentamos todo el contenido para evitar errores de compilación

/*
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

export const authOptions = {
  callbacks: {
    session({ session, token }: { session: any; token: JWT }) {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  // ... resto de la configuración
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 
*/

// Exportar un handler vacío para evitar errores
export async function GET() {
  return new Response(JSON.stringify({ error: "Not implemented" }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST() {
  return new Response(JSON.stringify({ error: "Not implemented" }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
} 