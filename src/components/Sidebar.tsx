'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export function Sidebar() {
  const { user, signOut } = useAuth();  // Cambiado a signOut
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    { icon: '🏠', name: 'Dashboard', href: '/dashboard' },
    { icon: '📊', name: 'Trades', href: '/trades' },
    { icon: '📓', name: 'Journal', href: '/journal' },
    { icon: '📝', name: 'Notebook', href: '/notebook' },
    { icon: '📈', name: 'Reports', href: '/reports' },
    { icon: '📚', name: 'Playbooks', href: '/playbooks' },
    { icon: '📊', name: 'Progress Tracker', href: '/progress', badge: 'Beta' },
    { icon: '🎬', name: 'Trade Replay', href: '/replay' },
    { icon: '📚', name: 'Resource Center', href: '/resources' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#0F1729] text-white">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <Image
          src="/logo.png"
          alt="TradeZella"
          width={32}
          height={32}
          className="mr-2"
        />
        <span className="text-xl font-semibold">TradeZella</span>
      </div>

      {/* Add Trade Button */}
      <button className="mx-4 my-2 p-2 bg-purple-600 rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors">
        <span className="mr-2">+</span>
        Add Trade
      </button>

      {/* Navigation Menu */}
      <nav className="px-2 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg mb-1"
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center w-full text-gray-300 hover:bg-gray-800 p-2 rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-gray-600 mr-3 flex items-center justify-center">
            {user?.user_metadata?.full_name?.[0] || '?'}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">
              {user?.user_metadata?.full_name || 'User'}
            </div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
        </button>

        {isProfileOpen && (
          <div className="mt-2 py-2 bg-gray-800 rounded-lg">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              Profile Settings
            </Link>
            <button
              onClick={async () => {
                try {
                  await signOut();
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
