import { useState, useEffect } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { supabase } from '@/lib/db';
import type { MTConnection } from '@/types/mt-connection';

export function useMTConnections() {
  const { session } = useAuthContext();
  const [connections, setConnections] = useState<MTConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadConnections();
    }
  }, [session?.user?.id]);

  async function loadConnections() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('mt_connections')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Formatear los datos para mostrar correctamente el login
      const formattedConnections = data.map(conn => ({
        ...conn,
        name: `MT5 ${conn.login || 'undefined'}`,
        displayName: conn.login ? `MT5 ${conn.login}` : 'MT5 undefined'
      }));

      setConnections(formattedConnections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }

  const addConnection = async (connectionData: Partial<MTConnection>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mt_connections')
        .insert([{ ...connectionData, user_id: session?.user?.id }])
        .select()
        .single();

      if (error) throw error;
      await loadConnections();
      return data;
    } catch (err) {
      console.error('Error adding connection:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('mt_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', session?.user?.id);

      if (error) throw error;
      await loadConnections();
    } catch (err) {
      console.error('Error removing connection:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    connections,
    loading,
    error,
    refresh: loadConnections,
    addConnection,
    removeConnection
  };
} 