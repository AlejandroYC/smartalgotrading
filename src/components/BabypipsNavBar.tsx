import React, { useState, useEffect } from 'react';
import { AiOutlineMenu } from 'react-icons/ai';

interface TradingItem {
  title: string;
  imageUrl: string;
  link: string;
  date: string;
}

const tradingTabs = [
  'Trade Ideas',
  'Technical Analysis',
  'Psychology',
  'Trading Systems',
  'Crypto',
];

const tradingContent: TradingItem[] = [
  {
    title: 'Premium Watchlist Recap: April 15, 2025',
    imageUrl: '/images/recap-0415.png',
    link: '/recaps/2025-04-15',
    date: 'April 15, 2025',
  },
  {
    title: 'Premium Watchlist Recap: April 8, 2025',
    imageUrl: '/images/recap-0408.png',
    link: '/recaps/2025-04-08',
    date: 'April 8, 2025',
  },
  {
    title: 'Premium Watchlist Recap: March 31, 2025',
    imageUrl: '/images/recap-0331.png',
    link: '/recaps/2025-03-31',
    date: 'March 31, 2025',
  },
  {
    title: 'Premium Watchlist Recap: March 25, 2025',
    imageUrl: '/images/recap-0325.png',
    link: '/recaps/2025-03-25',
    date: 'March 25, 2025',
  },
];

const BabypipsNavBar: React.FC = () => {
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  // Prevent horizontal scroll on body
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = '';
    };
  }, []);

  return (
    <nav className="bg-[#29bc1e] text-white relative z-50">
      {/* Main navbar container */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img src="/images/logo-similar.png" alt="Logo" className="h-10" />
        </div>

        {/* Nav items */}
        <ul className="hidden md:flex items-center space-x-6 font-medium uppercase text-sm tracking-wide">
          <li
            onMouseEnter={() => setShowMegaMenu(true)}
            onMouseLeave={() => setShowMegaMenu(false)}
          >
            <a href="#" className="px-2 py-1 hover:underline">
              Trading
            </a>
          </li>
          <li><a href="#" className="hover:underline">Analysis</a></li>
          <li><a href="#" className="hover:underline">News</a></li>
          <li><a href="#" className="hover:underline">Learn Forex</a></li>
          <li><a href="#" className="hover:underline">Learn Crypto</a></li>
          <li><a href="#" className="hover:underline">Forums</a></li>
          <li><a href="#" className="hover:underline">Calendar</a></li>
          <li><a href="#" className="hover:underline">Tools</a></li>
          <li><a href="#" className="hover:underline">MarketMilk™</a></li>
        </ul>

        {/* Sign In / Mobile menu icon */}
        <div className="flex items-center space-x-4">
          <a href="#" className="hidden md:block font-medium hover:underline">Sign In | Join</a>
          <AiOutlineMenu className="md:hidden cursor-pointer" />
        </div>
      </div>

      {/* Mega-menu dropdown positioned within nav (full width) */}
      {showMegaMenu && (
        <div
          className="absolute top-[60px] left-0 right-0 w-screen bg-white h-[78px] z-[9997] flex justify-center"
          style={{
            WebkitBoxShadow: '0 2px 4px 0 hsla(217, 7%, 48%, .09)',
            boxShadow: '0 2px 4px 0 hsla(217, 7%, 48%, .09)',
          }}
          onMouseEnter={() => setShowMegaMenu(true)}
          onMouseLeave={() => setShowMegaMenu(false)}
        >
          <div className="flex space-x-8 px-20">
            {tradingTabs.map((tab) => (
              <span
                key={tab}
                className="text-xs font-semibold uppercase hover:text-[#29bc1e] cursor-pointer"
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default BabypipsNavBar;
