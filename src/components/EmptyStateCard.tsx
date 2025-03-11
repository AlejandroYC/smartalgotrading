import React from 'react';
import Image from 'next/image';

interface EmptyStateCardProps {
  icon: 'cards' | 'cloud' | 'trades';
  message: string;
  submessage?: string;
  action?: {
    text: string;
    href: string;
  };
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ 
  icon, 
  message, 
  submessage,
  action 
}) => {
  const icons = {
    cards: (
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="15" width="70" height="45" rx="4" fill="#F3F4F6"/>
        <rect x="30" y="25" width="50" height="5" rx="2.5" fill="#E5E7EB"/>
        <rect x="30" y="35" width="30" height="5" rx="2.5" fill="#E5E7EB"/>
        <rect x="40" y="20" width="70" height="45" rx="4" fill="#F3F4F6" fillOpacity="0.5"/>
      </svg>
    ),
    cloud: (
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 30C51.7157 30 45 36.7157 45 45C45 53.2843 51.7157 60 60 60H80C86.6274 60 92 54.6274 92 48C92 41.3726 86.6274 36 80 36C79.2051 36 78.4264 36.0762 77.6713 36.2222C75.5219 32.4321 71.5149 30 67 30H60Z" fill="#F3F4F6"/>
        <path d="M63 37C63 35.3431 61.6569 34 60 34C58.3431 34 57 35.3431 57 37V43C57 44.6569 58.3431 46 60 46C61.6569 46 63 44.6569 63 43V37Z" fill="#E5E7EB"/>
        <circle cx="60" cy="50" r="2" fill="#E5E7EB"/>
      </svg>
    ),
    trades: (
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="20" width="70" height="40" rx="4" fill="#F3F4F6"/>
        <path d="M35 35H85" stroke="#E5E7EB" strokeWidth="2"/>
        <path d="M35 45H85" stroke="#E5E7EB" strokeWidth="2"/>
        <circle cx="45" cy="35" r="3" fill="#E5E7EB"/>
        <circle cx="45" cy="45" r="3" fill="#E5E7EB"/>
      </svg>
    )
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icons[icon]}
      <p className="text-sm text-gray-600 mt-4">
        {message}
      </p>
      {submessage && (
        <p className="text-sm text-gray-600 mt-1">
          {submessage}
          {action && (
            <a href={action.href} className="text-purple-600 hover:text-purple-700 ml-1">
              {action.text}
            </a>
          )}
        </p>
      )}
    </div>
  );
};

export default EmptyStateCard; 