import React from 'react';

interface StartMyDayButtonProps {
  onClick?: () => void;
  className?: string;
}

const StartMyDayButton: React.FC<StartMyDayButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-white text-[14px] font-medium rounded-lg px-2.5 py-2.5  flex items-center justify-center ${className}`}
    >
      {/* Icono de cohete */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="mr-2"
      >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
      </svg>
      Start my day
    </button>
  );
};

export default StartMyDayButton; 