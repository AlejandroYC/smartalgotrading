// BabypipsContentSection.tsx
import React from 'react';

const BabypipsContentSection: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">

        {/* Columna izquierda */}
        <div className="md:col-span-2 space-y-10">
          
          {/* Primer artículo */}
          <div className="border-b border-gray-200 pb-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900 font-roboto">Weekly FX Market RECAP</h2>
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">AVAIVER</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">FX Weekly Recap: March 3 – 7, 2025</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 border-2 border-gray-300 rounded-sm mr-3 
                    checked:bg-[#16a34a] checked:border-[#16a34a] focus:ring-0"
                />
                <span className="text-gray-700">Share age by Ryan</span>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 border-2 border-gray-300 rounded-sm mr-3 
                    checked:bg-[#16a34a] checked:border-[#16a34a] focus:ring-0"
                />
                <span className="font-semibold text-gray-900">GETTING</span>
              </div>
            </div>

            <p className="mt-6 text-gray-600 leading-relaxed">
              It was a jam-packed trading week as top tier economic data. an ECB ride out, escalating trade tensions, and Trump’s accusations of
            </p>
          </div>

          {/* Segundo artículo (misma estructura) */}
          {/* ... */}
        </div>

        {/* Columna derecha */}
        <div className="space-y-10">
          {/* Herramienta de horas */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Forex Market Hours Tool</h3>
            <p className="text-gray-600 mb-2">
              When one the best times to trade force?
            </p>
            <p className="text-[#16a34a] font-medium hover:underline cursor-pointer">
              View them in your own local time zone!
            </p>
          </div>

          {/* Problemas de mercado */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Market Problems</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 border-2 border-gray-300 rounded-sm mr-3 
                      checked:bg-[#16a34a] checked:border-[#16a34a] focus:ring-0"
                  />
                  <span className="text-gray-700">${n} billion ago by Ryan</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BabypipsContentSection;