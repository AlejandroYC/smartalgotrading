'use client';
import { useMTConnections } from '@/hooks/useMTConnections';

export function MTConnectionsList() {
  const { connections, loading } = useMTConnections();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {connections.map(connection => (
        <div key={connection.id} className="border p-4 rounded-lg">
          <div className="flex justify-between">
            <div>
              <h3>Account: {connection.account_number}</h3>
              <p>Server: {connection.server}</p>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded ${connection.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {connection.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 