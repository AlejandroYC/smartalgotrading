import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import analyticsImg from '../images/analitycs-1.webp';
import notebookImg from '../images/notebook-1.webp';
import reportingImg from '../images/reporting-1.webp';

const options = [
  {
    id: 'backtest',
    icon: '📊',
    title: 'Prueba retrospectiva',
    description: 'Utilice todas las herramientas de TradeZella para mejorar su estrategia de trading.',
    image: analyticsImg
  },
  {
    id: 'repeat',
    icon: '🔄',
    title: 'Repetición',
    description: 'Revise y repita las condiciones del mercado para mejorar su trading.',
    image: notebookImg
  },
  {
    id: 'improve',
    icon: '📈',
    title: 'Mejorar',
    description: 'Observe cómo las estadísticas hablan por sí solas.',
    image: reportingImg
  }
];

const BacktestingSection = () => {
  const [activeOption, setActiveOption] = useState(options[0]);

  return (
    <section className="py-12 md:py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <span className="text-[#7C3AED] uppercase tracking-wider text-xs md:text-sm font-medium mb-2 md:mb-4 block">
          PRUEBAS RETROSPECTIVAS Y REPRODUCCIÓN
        </span>
        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          <span className="text-[#1E293B] block md:inline">Llévelo un paso más allá.</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#DB2777] block md:inline">
            Pruebas retrospectivas. Repita. Mejore
          </span>
          <span className="text-[#1E293B]">.</span>
        </h2>
        <p className="text-base md:text-lg text-[#64748B] mb-8 md:mb-12 max-w-3xl mx-auto px-4 md:px-0">
          Utilice todas las herramientas de TradeZella para mejorar su estrategia de trading. 
          Observe cómo las estadísticas hablan por sí solas.
        </p>

        {/* Botones de selección - Responsive */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-8 md:mb-12">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveOption(option)}
              className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg transition-all ${
                activeOption.id === option.id
                ? 'bg-[#7C3AED] text-white shadow-lg scale-105'
                : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
              }`}
            >
              <span className="text-lg md:text-xl">{option.icon}</span>
              <span className="text-sm md:text-base whitespace-nowrap">{option.title}</span>
            </button>
          ))}
        </div>

        {/* Contenido dinámico - Responsive */}
        <div className="max-w-4xl mx-auto px-4 md:px-0">
          <h3 className="text-xl md:text-2xl font-bold text-[#1E293B] mb-3 md:mb-4">
            {activeOption.title}
          </h3>
          <p className="text-sm md:text-base text-[#64748B] mb-6 md:mb-8">
            {activeOption.description}
          </p>
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
            <Image
              src={activeOption.image}
              alt={activeOption.title}
              fill
              className="object-cover object-center transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
          </div>
        </div>

        <Link 
          href="#" 
          className="inline-flex items-center text-[#7C3AED] hover:text-[#DB2777] mt-6 md:mt-8 text-sm md:text-base"
        >
          <span>Aprenda más</span>
          <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
};

export default BacktestingSection; 