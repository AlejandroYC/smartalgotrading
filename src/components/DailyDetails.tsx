import React from 'react';
import { format } from 'date-fns';

interface DailyDetailsProps {
  date: string;
  stats?: {
    profit: number;
    trades: number;
    status: 'win' | 'loss' | 'break_even';
  };
  onClose: () => void;
}

const DailyDetails: React.FC<DailyDetailsProps> = ({ date, stats, onClose }) => {
  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2>No data available for {date}</h2>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  let bgColor = 'bg-gray-100'; // Default
  if (stats) {
    bgColor = stats.status === 'win' ? 'bg-green-100' :
              stats.status === 'loss' ? 'bg-red-100' :
              'bg-gray-100';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {format(new Date(date), 'MMMM d, yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="text-xl font-bold">{stats.trades}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Net P&L</p>
              <p className={`text-xl font-bold ${stats.profit > 0 ? 'text-green-500' : stats.profit < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                ${stats.profit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Day Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${bgColor}`} />
              <p className="capitalize">{stats.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyDetails; 