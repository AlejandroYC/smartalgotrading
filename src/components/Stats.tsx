import React from 'react';

const statsData = [
  { value: '20,2B+', label: 'Operaciones Registradas' },
  { value: '100K+', label: 'Sesiones de Backtesting' },
  { value: '1M+', label: 'Operaciones Compartidas' },
  { value: '20K+', label: 'Traders a Bordo' },
];

const Stats = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 text-[#1E293B]">Estadísticas Clave</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-3xl font-bold text-[#1E293B]">{stat.value}</h3>
              <p className="text-lg text-[#64748B]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats; 