import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('=== CONFIRM ROUTE STARTED ===');
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    console.log('URL:', request.url);
    console.log('Token:', token);
    console.log('Type:', type);

    const supabase = createRouteHandlerClient({ cookies });

    if (type === 'signup' && token) {
      console.log('Verifying OTP...');
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      console.log('Verification result:', { data, error });

      if (!error) {
        console.log('Getting user...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('User found:', user);

        if (user) {
          console.log('Attempting to create profile...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || '',
                email_confirmed: true,
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          console.log('Profile creation result:', { profile, profileError });

          if (profileError) {
            throw profileError;
          }
        }
      } else {
        throw error;
      }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
} 