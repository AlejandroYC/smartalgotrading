import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Crear cliente de Supabase
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const accountNumber = searchParams.get('accountNumber');
    
    if (!accountNumber) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Se requiere número de cuenta' },
        { status: 400 }
      );
    }
    
    // Verificar que la cuenta pertenece al usuario
    const { data: accountData, error: accountError } = await supabase
      .from('mt_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_number', accountNumber)
      .single();
    
    if (accountError || !accountData) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Cuenta no encontrada o no autorizada' },
        { status: 404 }
      );
    }
    
    // Obtener URL base del API
    const apiBaseUrl = process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.225.209.243.nip.io';
    
    // Obtener datos actualizados del servidor MT5
    const response = await fetch(`${apiBaseUrl}/update-account-data/${accountNumber}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Error de servidor MT5: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(responseData.message || 'Error desconocido al actualizar datos');
    }
    
    // Retornar datos
    return NextResponse.json({
      success: true,
      data: responseData.data,
      account: accountNumber,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en API journal-data:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
} 