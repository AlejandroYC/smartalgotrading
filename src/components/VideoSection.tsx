import React from 'react';

const VideoSection = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 text-[#1E293B]">Analice sus estadísticas comerciales</h2>
        <p className="text-lg text-[#64748B] mb-12">
        Tómate un momento para comprender qué errores cometiste, si arriesgaste más de lo planeado y conoce estadísticas más específicas del trading.
        </p>
        <video 
          autoPlay
          loop
          muted
          playsInline
          className="w-full max-w-5xl mx-auto rounded-lg shadow-lg"
        >
          <source src="/videos/video-1.mp4" type="video/mp4" />
          Tu navegador no soporta la etiqueta de video.
        </video>
      </div>
    </section>
  );
};

export default VideoSection; 