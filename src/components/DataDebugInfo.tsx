import React from 'react';

interface DataDebugInfoProps {
  accountData: any;
}

const DataDebugInfo: React.FC<DataDebugInfoProps> = ({ accountData }) => {
  if (!accountData) return null;
  
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs">
      <h4 className="font-semibold mb-2">Información de Debug</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p><strong>ID:</strong> {accountData.accountId || accountData.connectionId}</p>
          <p><strong>Cuenta:</strong> {accountData.accountNumber}</p>
          <p><strong>Actualizado:</strong> {new Date(accountData.lastUpdated).toLocaleString()}</p>
        </div>
        <div>
          <p><strong>Trades:</strong> {accountData.statistics?.total_trades || 'N/A'}</p>
          <p><strong>Win Rate:</strong> {accountData.statistics?.win_rate?.toFixed(2) || 'N/A'}%</p>
          <p><strong>Balance:</strong> ${accountData.statistics?.balance?.toFixed(2) || 'N/A'}</p>
        </div>
      </div>
      
      <details className="mt-2">
        <summary className="cursor-pointer text-blue-500">Ver datos completos</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
          {JSON.stringify(accountData, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default DataDebugInfo; 