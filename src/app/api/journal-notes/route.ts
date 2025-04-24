import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Función para manejar solicitudes GET (obtener notas)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');
    const accountNumber = searchParams.get('accountNumber');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Construir consulta para obtener notas
    let query = supabase
      .from('journal_notes')
      .select('*')
      .eq('user_id', userId);

    // Filtrar por fecha si se proporciona
    if (date) {
      query = query.eq('trade_date', date);
    }

    // Filtrar por número de cuenta si se proporciona
    if (accountNumber) {
      query = query.eq('account_number', accountNumber);
    }

    // Ordenar por fecha descendente
    query = query.order('trade_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching journal notes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data });
  } catch (error) {
    console.error('Error in GET journal notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Función para manejar solicitudes POST (crear nueva nota)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tradeDate, accountNumber, content, title } = body;

    if (!userId || !tradeDate || !content) {
      return NextResponse.json(
        { error: 'User ID, trade date, and content are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insertar nueva nota
    const { data, error } = await supabase
      .from('journal_notes')
      .insert([
        {
          user_id: userId,
          trade_date: tradeDate,
          account_number: accountNumber,
          content,
          title
        }
      ])
      .select();

    if (error) {
      console.error('Error creating journal note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in POST journal note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Función para manejar solicitudes PUT (actualizar nota existente)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Actualizar nota existente
    const { data, error } = await supabase
      .from('journal_notes')
      .update({ 
        content,
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating journal note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data[0] });
  } catch (error) {
    console.error('Error in PUT journal note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Función para manejar solicitudes DELETE (eliminar nota)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Eliminar nota
    const { error } = await supabase
      .from('journal_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting journal note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE journal note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 