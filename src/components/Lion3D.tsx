'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import lion2 from '../images/lion2.png';

const Lion3D = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const animate = () => {
      const time = Date.now() * 0.001;
      setPosition({
        x: Math.sin(time * 0.3) * 5,
        y: Math.cos(time * 0.3) * 5,
      });
    };

    const interval = setInterval(animate, 1000 / 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#0A0A0A]">
      {/* Fondo con gradiente oscuro */}
      <div className="absolute inset-0 bg-gradient-radial from-[#1A1A1A] to-black" />
      
      {/* Efecto de partículas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-[#FFD700] rounded-full"
            style={{
              left: `${Math.floor((i * 13) % 100)}%`,
              top: `${Math.floor((i * 17) % 100)}%`,
              opacity: 0.3 + (i % 5) * 0.1,
              animationName: 'float',
              animationDuration: `${20 + (i % 15)}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${-(i % 25)}s`,
              transform: 'scale(1.2)',
              filter: 'blur(1px) brightness(1.1)',
              boxShadow: '0 0 8px rgba(218, 165, 32, 0.6)',
            }}
          />
        ))}
      </div>

      {/* Contenedor del león */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative w-[95vmin] h-[95vmin] md:w-[90vw] md:h-[90vh]"
          style={{ 
            perspective: '2000px',
            maxWidth: '1500px',
            maxHeight: '1500px'
          }}
        >
          <div
            className="relative w-full h-full transition-all duration-1000 ease-out"
            style={{
              transform: `
                rotateY(${position.x}deg) 
                rotateX(${-position.y}deg)
                scale3d(1, 1, 1)
              `,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Resplandor detrás del león */}
            <div className="absolute inset-0 bg-gradient-radial from-[#DAA520]/20 to-transparent blur-2xl" />

            {/* Imagen del león */}
            <Image
              src={lion2}
              alt="Smart Algo Trading Lion"
              fill
              className="object-contain drop-shadow-2xl p-4"
              style={{
                filter: 'drop-shadow(0 0 50px rgba(218, 165, 32, 0.5))',
              }}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lion3D; 