import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
  
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

   

    const supabase = createRouteHandlerClient({ cookies });

    if (type === 'signup' && token) {
     
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

     

      if (!error) {
     
        const { data: { user } } = await supabase.auth.getUser();
     

        if (user) {
    
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
  
    return NextResponse.redirect(new URL('/error', request.url));
  }
} 