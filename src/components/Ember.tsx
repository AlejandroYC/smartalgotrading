'use client';
import { useEffect, useState } from 'react';

interface EmberProps {
  index: number;
}

const Ember = ({ index }: EmberProps) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    const translateX = -20 + Math.random() * 40;
    const rotate = 45 + Math.random() * 90;
    
    // Colores más intensos y brillantes
    const colors = [
      [255, 215, 0],    // Oro puro
      [255, 191, 0],    // Ámbar dorado
      [255, 165, 0],    // Naranja dorado
      [255, 140, 0],    // Dorado oscuro
      [218, 165, 32],   // Dorado clásico
    ];
    
    const colorIndex = index % colors.length;
    const [r, g, b] = colors[colorIndex];
    
    setStyle({
      left: `${(index * 10) % 100}%`,
      top: `${(index * 7) % 100}%`,
      width: `${10 + (index % 12)}px`,         // Partículas más grandes
      height: `${10 + (index % 12)}px`,
      background: `rgba(${r}, ${g}, ${b}, ${0.6 + (index % 4) * 0.1})`, // Mayor opacidad
      borderRadius: '50%',
      filter: 'blur(1.5px) brightness(1.4)',    // Más brillo, menos blur
      boxShadow: `
        0 0 15px rgba(${r}, ${g}, ${b}, 0.6),
        0 0 30px rgba(${r}, ${g}, ${b}, 0.3),
        0 0 45px rgba(${r}, ${g}, ${b}, 0.15)
      `,                                        // Glow effect más pronunciado
      '--translate-x': `${translateX}px`,
      '--rotate': `${rotate}deg`,
      '--duration': `${45 + (index % 30)}s`,   // Duración más larga
      animationDelay: `-${(index * 4) % 40}s`,
      zIndex: 10,                              // Asegurar que las partículas estén por encima
    } as React.CSSProperties);
  }, [index]);

  return (
    <div 
      className="absolute animate-ember" 
      style={style}
    />
  );
};

export default Ember; 