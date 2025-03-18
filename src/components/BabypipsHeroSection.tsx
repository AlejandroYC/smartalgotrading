import React from 'react';

const BabypipsHeroSection: React.FC = () => {
  return (
    <section className="bg-[#56c51f] h-[360px] flex items-center">
      <div className="max-w-6xl mx-auto px-4 flex w-full">
        {/* Contenedor de Texto (ancho fijo 310px) */}
        <div className="w-[310px]">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            New to Forex?
          </h1>
          <p className="text-[17px] text-white mb-6">
            Learn the basics of forex trading with our comprehensive guide. Get started and discover everything you need to become a successful trader.
          </p>
          <button className="bg-white text-black py-4 px-8 rounded-full font-bold hover:bg-black hover:text-white transition">
            Start Learning
          </button>
        </div>
        {/* Contenedor de Imagen (ocupa el resto del espacio) */}
        <div className="flex-1 flex justify-end">
          <img
            src="c06d4d2b8b27256ad6e4.webp"
            alt="Forex Hero"
            className="h-full object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default BabypipsHeroSection;
