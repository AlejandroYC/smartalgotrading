'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AddTradeModal from '@/components/AddTradeModal';
import SecondSidebar from '@/components/SecondSidebar';
import { TradingDataProvider } from '@/contexts/TradingDataContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const Sidebar = () => {
    const menuItems = [
      { icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },
      { icon: '📝', label: 'Trades', href: '/dashboard/trades' },
      { icon: '📓', label: 'Journal', href: '/dashboard/yjournal' },
      { icon: '📚', label: 'Notebook', href: '/dashboard/notebook' },
      { icon: '📋', label: 'Reports', href: '/dashboard/reports' },
      { icon: '📖', label: 'Playbooks', href: '/dashboard/playbooks' },
      { icon: '🔄', label: 'Progress Tracker', href: '/dashboard/progress', badge: 'Beta' },
      { icon: '⏮️', label: 'Trade Replay', href: '/dashboard/replay' },
      { icon: '��', label: 'Resource Center', href: '/dashboard/resources' },
    ];

    return (
      <aside className="w-64 bg-gradient-to-b from-[#242b65] to-[#17192b] h-screen">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <Image src="/logo.png" alt="TradeZella" width={40} height={40} />
            <span className="text-white text-xl font-bold">TraderWellll</span>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-[#7C3AED] text-white rounded-lg py-2 px-4 flex items-center justify-center gap-2 mb-6 hover:bg-[#6D28D9] transition-colors"
          >
            <span>+</span> Add Trade
          </button>

          <nav>
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg mb-1 ${
                  item.active 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs bg-yellow-400 text-black px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    );
  };

  return (
    <TradingDataProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen bg-white">
          <div className="flex fixed left-0">
            <SecondSidebar />
            <Sidebar />
          </div>
          <div className="flex-1 ml-80">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
        
        <AddTradeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </TradingDataProvider>
  );
} 