import React from 'react';
import { AiOutlineMenu } from 'react-icons/ai';

const BabypipsNavBar: React.FC = () => {
  return (
    <nav className="bg-[#29bc1e] text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
        {/* Logo en su propio contenedor */}
        <div className="flex-shrink-0 mr-6">
          <img
            src="/images/logo-similar.png"
            alt="Pipsology Logo"
            className="h-10 w-auto"
          />
        </div>
        {/* Menú principal (centro) */}
        <ul className="hidden md:flex space-x-6 font-medium flex-grow">
          <li>
            <a href="#" className="hover:underline">
              News
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Trends
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Forums
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Education
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Analysis
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Tools
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              Brokers
            </a>
          </li>
          <li>
            <a href="#" className="hover:underline">
              About
            </a>
          </li>
        </ul>
        {/* Contenedor derecho: Sign In y íconos */}
        <div className="flex items-center space-x-4">
          <a href="#" className="hidden md:block font-medium hover:underline">
            Sign In / Log In
          </a>
    
          <AiOutlineMenu className="cursor-pointer md:hidden" />
        </div>
      </div>
    </nav>
  );
};

export default BabypipsNavBar;
