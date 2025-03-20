import React from 'react';

interface HangTightLoadingProps {
  message?: string;
  description?: string;
  fullScreen?: boolean;
}

export function HangTightLoading({ 
  message = "Hang tight", 
  description = "Loading...",
  fullScreen = true
}: HangTightLoadingProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-white z-50"
    : "absolute inset-0 bg-white z-40";

  return (
    <div className={`${containerClasses} flex items-center justify-center`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-12 h-3 flex justify-between">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-full bg-purple-600 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.9s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">{message}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
} 