import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Hacer logout en Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error al cerrar sesión en Supabase:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Crear respuesta con cookies limpias
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    });

    // Limpiar todas las cookies relacionadas con la autenticación
    const cookiesToDelete = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'token',
      '__client'
    ];
    
    cookiesToDelete.forEach(cookieName => {
      try {
        response.cookies.set(cookieName, '', { 
          maxAge: 0, 
          path: '/' 
        });
      } catch (e) {
        console.error(`Error al eliminar cookie ${cookieName}:`, e);
      }
    });
    
    // Asegurar que la respuesta no se almacene en caché
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 