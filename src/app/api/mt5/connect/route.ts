import { NextResponse } from 'next/server';
import { MT5Client } from '@/services/mt5/mt5Client';
// Eliminar importación de next-auth
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    // Reemplazar la autenticación de next-auth con Supabase o simplemente
    // obtener el user_id del cuerpo de la solicitud
    // const session = await getServerSession(authOptions);
    
    const { accountNumber, password, server, userId } = await req.json();

    if (!accountNumber || !password || !server || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const mt5Client = MT5Client.getInstance();
    const connected = await mt5Client.connectAccount(userId, {
      accountNumber,
      password,
      server,
      connection_id: userId
    });

    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to MT5' },
        { status: 400 }
      );
    }

    // Obtener información inicial de la cuenta
    const accountInfo = await mt5Client.getActiveAccountStatus(userId, userId);

    return NextResponse.json({ 
      success: true,
      accountInfo
    });
  } catch (error) {
    console.error('Error connecting MT5 account:', error);
    return NextResponse.json(
      { error: 'Failed to connect MT5 account' },
      { status: 500 }
    );
  }
} 