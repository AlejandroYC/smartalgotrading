import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { validateMTCredentials } from '@/lib/mt-client';
import { encryptCredentials } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform_type, server, account_number, password } = await request.json();

    // Validar credenciales con MT4/MT5 (implementar después)
    const isValid = await validateMTCredentials(platform_type, server, account_number, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid MT4/MT5 credentials' },
        { status: 400 }
      );
    }

    // Encriptar credenciales antes de guardar
    const encryptedToken = await encryptCredentials(password);

    // Guardar conexión en la base de datos
    const { data, error } = await supabase
      .from('mt_connections')
      .insert([
        {
          user_id: session.user.id,
          platform_type,
          server,
          account_number,
          token: encryptedToken,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('MT connection error:', error);
    return NextResponse.json(
      { error: 'Failed to create MT connection' },
      { status: 500 }
    );
  }
} 