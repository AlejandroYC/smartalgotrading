'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import reportingImg from '../images/reporting-1.webp';
import analyticsImg from '../images/analitycs-1.webp';
import backtestingImg from '../images/backtesting-1.webp';

const ReportsSection = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <span className="text-[#7C3AED] uppercase tracking-wider text-sm font-medium mb-4 block">
          INFORMES BASADOS EN DATOS
        </span>
        <h2 className="text-4xl font-bold mb-4">
          <span className="text-[#7C3AED]">Obtenga información</span>
          <span className="text-[#1E293B]"> clave .</span>
        </h2>
        <p className="text-lg text-[#64748B] mb-12 max-w-3xl mx-auto">
          Aproveche más de 50 informes para monitorear su progreso comercial, 
          comprender sus fortalezas o debilidades y mejorar su estrategia comercial.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-12">
          {/* Primera tarjeta */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-6 text-white flex flex-col">
            <h3 className="text-2xl font-bold mb-4">Profundice en su estrategia</h3>
            <p className="mb-6">Más de 50 informes para ayudarle a visualizar su rendimiento comercial.</p>
            <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
              <Image
                src={reportingImg}
                alt="Reporting"
                fill
                className="object-cover"
              />
            </div>
            <Link href="#" className="mt-auto text-white flex items-center hover:opacity-80">
              <span>Ver más</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Segunda tarjeta */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl p-6 text-white flex flex-col">
            <h3 className="text-2xl font-bold mb-4">Comprenda sus comportamientos comerciales</h3>
            <p className="mb-6">Obtenga información clave sobre sus comportamientos comerciales analizando en profundidad más de 50 informes.</p>
            <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
              <Image
                src={analyticsImg}
                alt="Analytics"
                fill
                className="object-cover"
              />
            </div>
            <Link href="#" className="mt-auto text-white flex items-center hover:opacity-80">
              <span>Ver más</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Tercera tarjeta */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white flex flex-col">
            <h3 className="text-2xl font-bold mb-4">Obtenga un resumen de lo que funciona para usted</h3>
            <p className="mb-6">Resúmenes seleccionados para que comprenda sus fortalezas y debilidades como comerciante.</p>
            <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
              <Image
                src={backtestingImg}
                alt="Backtesting"
                fill
                className="object-cover"
              />
            </div>
            <Link href="#" className="mt-auto text-white flex items-center hover:opacity-80">
              <span>Ver más</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <Link 
            href="#" 
            className="inline-block bg-gradient-to-r from-[#7C3AED] via-[#9D3AED] to-[#DB2777] text-white px-8 py-3 rounded-lg text-lg font-medium hover:opacity-90 transition-opacity"
          >
            Empieza ahora {'>'}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReportsSection; 