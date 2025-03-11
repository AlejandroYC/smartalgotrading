'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface MT5ConnectionFormProps {
  onSuccess: () => Promise<void>;
}

export default function MT5ConnectionForm({ onSuccess }: MT5ConnectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: '',
    password: '',
    server: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/mt5/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('MT5 account connected successfully');
        await onSuccess();
      } else {
        toast.error(data.error || 'Failed to connect MT5 account');
      }
    } catch (error) {
      toast.error('An error occurred while connecting your account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Account Number
        </label>
        <input
          type="text"
          value={formData.accountNumber}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            accountNumber: e.target.value
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            password: e.target.value
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Server
        </label>
        <input
          type="text"
          value={formData.server}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            server: e.target.value
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isLoading ? 'Connecting...' : 'Connect MT5 Account'}
      </button>
    </form>
  );
} 