import { NextApiRequest, NextApiResponse } from 'next';

// Eliminamos la importación de MetaAPI ya que usamos conexión directa a MT5
// import MetaApi from 'metaapi.cloud-sdk';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountNumber, password, server } = req.body;

    if (!accountNumber || !password || !server) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Aquí podemos usar nuestra propia lógica de conexión MT5
    // que ya está funcionando en el backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_MT5_API_URL}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumber,
        password,
        server
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to connect to MT5');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error connecting to MT5:', error);
    return res.status(500).json({ error: 'Failed to connect to MT5' });
  }
} 