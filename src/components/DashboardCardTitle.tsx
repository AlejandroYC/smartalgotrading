import React from 'react';

interface DashboardCardTitleProps {
  title: string;
  showInfo?: boolean;
  beta?: boolean;
  viewMore?: boolean;
  onViewMore?: () => void;
}

const DashboardCardTitle: React.FC<DashboardCardTitleProps> = ({
  title,
  showInfo = false,
  beta = false,
  viewMore = false,
  onViewMore
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm text-gray-600">{title}</h3>
        {beta && (
          <span className="bg-yellow-400 text-xs px-2 py-0.5 rounded text-black">BETA</span>
        )}
        {showInfo && (
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </button>
        )}
      </div>
      {viewMore && (
        <button 
          onClick={onViewMore}
          className="text-purple-600 text-sm hover:text-purple-700"
        >
          View more
        </button>
      )}
    </div>
  );
};

export default DashboardCardTitle; 