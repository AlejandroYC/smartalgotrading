import { NextResponse } from 'next/server';

// Lista predefinida de servidores MT5 comunes
const commonServers = [
  {
    name: "Weltrade-Real",
    description: "Weltrade Live Server"
  },
  {
    name: "Weltrade-Demo",
    description: "Weltrade Demo Server"
  }
  // Puedes agregar más servidores aquí
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.toLowerCase() || '';

    // Filtrar servidores basado en la consulta
    const filteredServers = commonServers.filter(server => 
      server.name.toLowerCase().includes(query) || 
      server.description.toLowerCase().includes(query)
    );

    return NextResponse.json({
      success: true,
      data: filteredServers
    });
  } catch (error) {
    console.error('Error searching servers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search servers' },
      { status: 500 }
    );
  }
} 