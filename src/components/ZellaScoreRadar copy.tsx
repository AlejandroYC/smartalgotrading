interface ZellaMetric {
  name: string;
  value: number;
  description: string;
}

interface ZellaScoreProps {
  metrics: ZellaMetric[];
  score?: number;
}

const calculateZellaScore = (metrics: ZellaMetric[]): number => {
  if (!metrics.length) return 0;
  const total = metrics.reduce((sum, metric) => sum + metric.value, 0);
  return (total / metrics.length) * 20; // Scale to 0-100
};

const ZellaScoreRadar: React.FC<ZellaScoreProps> = ({ metrics, score }) => {
  const displayScore = score !== undefined ? score : calculateZellaScore(metrics);
  
  const formattedData = metrics.map(metric => ({
    subject: metric.name,
    value: metric.value || 0,
    fullMark: 5,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start justify-start mb-4">
           <h1 className="text-2xl text-black font-bold text-left">Zella Score</h1>
        </div>

        <div className="flex items-center">
          <span className="text-3xl font-bold text-indigo-600">
            {(displayScore || 0).toFixed(2)}
          </span>
          <div className="ml-2 flex h-2 w-24 rounded-full bg-gray-200">
            <div 
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${displayScore || 0}%` }}
            />
          </div>
        </div>
      </div>
      <hr className="w-full border-t border-gray-200 mb-4" />

      {/* Resto del componente permanece igual */}
    </div>
  );
};

export default ZellaScoreRadar; 