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

    // Limpiar cookies estableciendo su tiempo de expiración a 0
    response.cookies.set('sb-access-token', '', { maxAge: 0 });
    response.cookies.set('sb-refresh-token', '', { maxAge: 0 });
    response.cookies.set('token', '', { maxAge: 0 });
    
    return response;

  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 