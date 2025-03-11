import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { encryptCredentials } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    // Obtener el cliente de Supabase con el contexto de autenticación
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { platform_type, server, account_number, password } = await request.json();

    // Validaciones
    if (!platform_type || !server || !account_number || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generar y encriptar el token
    const encryptedToken = await encryptCredentials(password);

    // Crear la conexión en Supabase
    const { data, error } = await supabase
      .from('mt_connections')
      .insert([
        {
          user_id: userId,
          account_number,
          server,
          token: encryptedToken, // Guardamos el token encriptado
          is_active: true,
          platform_type
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create connection' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating MT connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
} 