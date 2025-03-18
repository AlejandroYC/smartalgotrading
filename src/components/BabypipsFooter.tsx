import React from 'react';

const BabypipsFooter: React.FC = () => {
  return (
    <footer className="bg-[#2c2c2c] text-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Sección de enlaces principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1: LEARN FOREX */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-100 mb-3">LEARN FOREX</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-gray-100">How to Trade Forex</a></li>
              <li><a href="#" className="hover:text-gray-100">Forex Quizzes</a></li>
              <li><a href="#" className="hover:text-gray-100">Forex Forums</a></li>
              <li><a href="#" className="hover:text-gray-100">Forex Glossary</a></li>
              <li><a href="#" className="hover:text-gray-100">Forex Magnets</a></li>
              <li><a href="#" className="hover:text-gray-100">Technical Analysis 101</a></li>
              <li><a href="#" className="hover:text-gray-100">Risk Management 101</a></li>
            </ul>
          </div>

          {/* Columna 2: FOREX TOOLS */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-100 mb-3">FOREX TOOLS</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-gray-100">MarketMilk™</a></li>
              <li><a href="#" className="hover:text-gray-100">Currency Correlation Calculator</a></li>
              <li><a href="#" className="hover:text-gray-100">Position Size Calculator</a></li>
              <li><a href="#" className="hover:text-gray-100">Pivot Point Calculator</a></li>
              <li><a href="#" className="hover:text-gray-100">Profit Calculator</a></li>
            </ul>
          </div>

          {/* Columna 3: COMPANY */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-100 mb-3">COMPANY</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-gray-100">About</a></li>
              <li><a href="#" className="hover:text-gray-100">Contact</a></li>
              <li><a href="#" className="hover:text-gray-100">Advertise</a></li>
              <li><a href="#" className="hover:text-gray-100">Newsletter</a></li>
              <li><a href="#" className="hover:text-gray-100">Partnerships</a></li>
              <li><a href="#" className="hover:text-gray-100">FAQ</a></li>
            </ul>
          </div>

          {/* Columna 4: LOGO + TEXTO */}
          <div>
            <div className="flex items-center mb-3">
              {/* Reemplaza este src con el de tu logo real */}
              <img
                src="https://via.placeholder.com/80x30.png?text=BabyPips+Logo"
                alt="BabyPips Logo"
                className="mr-2"
              />
              <span className="text-xl font-bold text-gray-100">BabyPips</span>
            </div>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Babypips helps new traders learn about the forex and crypto markets without
              falling asleep. We provide the knowledge and tools you need to make better
              trading decisions.
            </p>
          </div>
        </div>

        {/* Franja final de copyright y enlaces legales */}
        <div className="mt-8 border-t border-gray-700 pt-4 text-sm text-gray-400 flex flex-col md:flex-row md:items-center md:justify-between">
          <p>© 2023 BabyPips.com LLC. All rights reserved.</p>
          <div className="space-x-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-gray-100">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-100">Terms and Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BabypipsFooter;
