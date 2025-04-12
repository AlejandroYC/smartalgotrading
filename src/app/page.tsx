'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import analyticsImg from '../images/analitycs-1.webp';
import notebookImg from '../images/notebook-1.webp';
import reportingImg from '../images/reporting-1.webp';
import journalImg from '../images/Journal-1.webp';
import backtestingImg from '../images/backtesting-1.webp';
import replayImg from '../images/Replay-1.webp';
import playbookImg from '../images/playbook-1.webp';
import mentoringImg from '../images/mentoring-1.webp';
import educationImg from '../images/educations.png';
import metatrader4Img from '../images/metatrader4.png';
import metatrader5Img from '../images/metatrader5.png';
import Stats from '../components/Stats';
import VideoSection from '../components/VideoSection';
import ReportsSection from '../components/ReportsSection';
import BacktestingSection from '../components/BacktestingSection';
import Footer from '../components/Footer';

const features = [
  { 
    name: 'Análisis', 
    icon: '📊',
    title: 'Tablero de Análisis Avanzado',
    description: 'Obtén información profunda sobre tu rendimiento comercial con herramientas de análisis completas. Realiza un seguimiento de tu progreso, identifica patrones y optimiza tu estrategia.',
    image: analyticsImg
  },
  { 
    name: 'Cuaderno', 
    icon: '📝',
    title: 'Cuaderno de Trading Inteligente',
    description: 'Documenta tus ideas y estrategias de trading en un solo lugar.',
    image: notebookImg
  },
  { 
    name: 'Informes', 
    icon: '📋',
    title: 'Informes de Trading Detallados',
    description: 'Genera informes completos de tu actividad comercial.',
    image: reportingImg
  },
  { 
    name: 'Diario', 
    icon: '📓',
    title: 'Diario de Trading',
    description: 'Mantén registros detallados de todas tus operaciones.',
    image: journalImg
  },
  { 
    name: 'Pruebas de Estrategia', 
    icon: '🔧',
    title: 'Pruebas de Estrategia',
    description: 'Prueba tus estrategias de trading contra datos históricos. Valida tus ideas antes de arriesgar capital real.',
    highlights: ['Pruebas Históricas', 'Validación de Estrategias', 'Evaluación de Riesgos'],
    image: backtestingImg
  },
  { 
    name: 'Repetición', 
    icon: '🔄',
    title: 'Repetición de Mercado',
    description: 'Revisa y repite las condiciones del mercado para comprender mejor tus operaciones. Perfecciona tu tiempo y toma de decisiones.',
    highlights: ['Revisión del Mercado', 'Análisis de Operaciones', 'Herramienta de Aprendizaje'],
    image: replayImg
  }, 
  { 
    name: 'Playbook', 
    icon: '▶️',
    title: 'Playbook de Trading',
    description: 'Crea y mantén tu propio playbook de trading. Documenta tus mejores configuraciones y reglas de trading.',
    highlights: ['Biblioteca de Configuraciones', 'Reglas de Trading', 'Mejores Prácticas'],
    image: playbookImg
  },
  { 
    name: 'Mentoría', 
    icon: '👨‍🏫',
    title: 'Mentoría Personalizada',
    description: 'Obtén sesiones de mentoría uno a uno para mejorar tus habilidades y estrategias de trading.',
    image: mentoringImg
  },
  { 
    name: 'Educación', 
    icon: '📚',
    title: 'Educación Integral',
    description: 'Accede a una gran cantidad de recursos educativos para mejorar tu conocimiento sobre trading.',
    image: educationImg
  }
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((current) => current === 0 ? features.length - 1 : current - 1);
  };

  const handleNext = () => {
    setActiveIndex((current) => current === features.length - 1 ? 0 : current + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Banner de Anuncio - Responsive */}
      <div className="bg-[#090f33] text-white py-2 md:py-3 px-2 md:px-4 text-center text-xs md:text-sm relative">
        <span className="inline-block">Backtesting 2.0 está ahora en vivo en Indices Sinteticos 🚀 . </span>
        <Link href="#" className="text-white underline hover:text-gray-300 inline-block">¡Consúltalo aquí!</Link>
        <button className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">×</button>
      </div>

      {/* Navbar - Responsive */}
      <nav className="bg-white py-2 md:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
              <Image
                          src="lmc-trade-morado.webp" 
                          alt="Logo LMC Trade"
                          width={200}
                          height={55}
                          
                        />
      
            <div className="hidden md:flex items-center space-x-4 md:space-x-8">
              <div className="relative group">
                <button className="text-[#1E293B] hover:text-black flex items-center">
                  Recursos
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <button className="text-[#1E293B] hover:text-black">Novedades</button>
              <button className="text-[#1E293B] hover:text-black">Precios</button>
              <button className="text-[#1E293B] hover:text-black">Soporte</button>
              {/* Agregar botones de login */}
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Ingresar
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] via-[#9D3AED] to-[#DB2777] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Comenzar {'>'}
              </Link>
            </div>
            {/* Menú hamburguesa para móvil */}
            <button className="md:hidden text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Sección Hero - Responsive */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            <span className="text-[#1E293B] block md:inline">La Única </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#9D3AED] to-[#DB2777] block md:inline">
              Herramienta que Necesitas
            </span>
            <span className="text-[#1E293B] block md:inline"> para Convertirte en </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#9D3AED] to-[#DB2777] block md:inline">
              Rentable
            </span>
          </h1>
          <p className="text-base md:text-lg mb-8 md:mb-12 max-w-2xl mx-auto px-4 md:px-0 text-[#64748B]">
            Indices Sinteticos te ayuda a descubrir tus fortalezas y debilidades para convertirte en un 
            trader rentable con el poder del journaling y análisis.
          </p>
          <Link 
            href="/dashboard" 
            className="inline-block bg-gradient-to-r from-[#7C3AED] via-[#9D3AED] to-[#DB2777] text-white px-6 md:px-8 py-2 md:py-3 rounded-lg text-base md:text-lg font-medium hover:opacity-90 transition-opacity"
          >
            Comienza Ahora {'>'}
          </Link>
        </div>
      </section>

      {/* Navegación de Características - Responsive */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 overflow-x-auto">
        <div className="flex items-center justify-start md:justify-center min-w-max space-x-4 md:space-x-8">
          <button 
            onClick={handlePrev}
            className="text-[#64748B] hover:text-[#1E293B] transition-colors shrink-0"
          >
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex space-x-4 md:space-x-8 overflow-x-auto pb-2">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`flex flex-col items-center transition-all duration-300 shrink-0 ${
                  index === activeIndex ? 'scale-110 opacity-100' : 'scale-90 opacity-60 hover:opacity-80'
                }`}
              >
                <div 
                  className={`p-3 md:p-4 rounded-lg mb-2 transition-colors mt-10 ${
                    index === activeIndex ? 'bg-[#0F1729]' : 'bg-white border border-gray-200'
                  }`} 
                  style={{ width: '70px', height: '70px' }}
                >
                  <span className="text-xl md:text-2xl flex items-center justify-center mt-1">{feature.icon}</span>
                </div>
                <span className="text-xs md:text-sm text-[#64748B] whitespace-nowrap">{feature.name}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="text-[#64748B] hover:text-[#1E293B] transition-colors shrink-0"
          >
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido de Características - Responsive */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-[#1E293B] mb-3 md:mb-4">
            {features[activeIndex].title}
          </h1>
          <p className="text-base md:text-xl text-[#64748B] max-w-3xl mx-auto px-4 md:px-0 mb-8 md:mb-12">
            {features[activeIndex].description}
          </p>
          
          {/* Contenedor de Imagen */}
          <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl">
            <Image
              src={features[activeIndex].image}
              alt={features[activeIndex].title}
              fill
              className="object-cover object-center transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority={activeIndex === 0}
            />
          </div>
        </div>
      </div>

      {/* Nueva Sección: Implementación con MetaTrader */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#9D3AED] to-[#DB2777]">
            Integración con MetaTrader
          </h2>
          <p className="text-lg text-[#64748B] mb-12">
            Indices Sinteticos se integra perfectamente con MetaTrader 4 y 5, permitiéndote llevar tu trading al siguiente nivel.
          </p>
          <div className="flex justify-center space-x-8">
            <div className="flex flex-col items-center">
          <Image
                src={metatrader4Img} 
                alt="MetaTrader 4" 
                width={150} 
                height={150} 
                className="rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
              />
              <span className="mt-2 text-sm text-[#1E293B]">MetaTrader 4</span>
            </div>
            <div className="flex flex-col items-center">
          <Image
                src={metatrader5Img} 
                alt="MetaTrader 5" 
                width={150} 
                height={150} 
                className="rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
              />
              <span className="mt-2 text-sm text-[#1E293B]">MetaTrader 5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Componente de Estadísticas */}
      <Stats />

      {/* Componente de Video */}
      <VideoSection />

      <ReportsSection />

      <BacktestingSection />

      <Footer />
    </div>
  );
}
