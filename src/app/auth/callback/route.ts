import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      await supabase.auth.exchangeCodeForSession(code);
      
      // Actualizar el estado de confirmación en la tabla profiles
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles')
          .update({ email_confirmed: true })
          .eq('id', user.id);
      }

      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      console.error('Error en la confirmación:', error);
      return NextResponse.redirect(
        new URL('/login?error=confirmation_failed', request.url)
      );
    }
  }

  return NextResponse.redirect(new URL('/login', request.url));
} 