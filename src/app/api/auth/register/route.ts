import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Registrar usuario
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
      }
    });

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data?.user) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Please check your email to verify your account. Your profile will be created after verification.',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
} 