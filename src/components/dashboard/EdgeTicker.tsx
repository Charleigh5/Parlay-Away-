import React from 'react';
import { useBestEdges } from '../../hooks/useBestEdges';
import { FireIcon } from '../icons';
import FootballLoader from '../common/FootballLoader';
import { useLiveDataPulse } from '../../hooks/useLiveDataPulse';

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'bg-green-500/20 text-green-300';
  if (grade.startsWith('B')) return 'bg-yellow-500/20 text-yellow-300';
  if (grade.startsWith('C')) return 'bg-orange-500/20 text-orange-300';
  return 'bg-gray-500/20 text-gray-300';
};

const TickerItem: React.FC<{ edge: ReturnType<typeof useBestEdges>['data'][0] }> = ({ edge }) => (
  <div className="flex items-center gap-4 mx-6 flex-shrink-0">
    {edge.isHot && <FireIcon className="h-5 w-5 text-red-500 animate-pulse" />}
    <span className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{edge.player}</span>
    <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{edge.prop}</span>
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getGradeColor(edge.grade)}`}>{edge.grade}</span>
    <div className="text-xs font-mono">
      <span className="text-green-400">ROI: {edge.roi.toFixed(1)}%</span>
      <span className="ml-2" style={{ color: 'hsl(var(--team-accent))' }}>Sharpe: {edge.sharpe.toFixed(2)}</span>
    </div>
  </div>
);

const EdgeTicker: React.FC = () => {
  const { data: edges, isLoading, error, dataVersion } = useBestEdges();
  const isPulsing = useLiveDataPulse(dataVersion);

  if (isLoading && edges.length === 0) {
    return (
      <div className="relative h-12 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="w-24">
            <FootballLoader />
        </div>
        <p className="text-sm ml-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading Best Edges...</p>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="relative h-12 flex items-center justify-center overflow-hidden bg-red-900/50" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const tickerContent = [...edges, ...edges];

  return (
    <div className={`relative h-12 flex items-center overflow-hidden ${isPulsing ? 'animate-live-data-pulse' : ''}`} style={{ backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="absolute inset-y-0 left-0 w-24 z-10" style={{ background: 'linear-gradient(to right, hsl(var(--secondary)), transparent)' }}></div>
        <div className="absolute inset-y-0 right-0 w-24 z-10" style={{ background: 'linear-gradient(to left, hsl(var(--secondary)), transparent)' }}></div>
        
        <style>{`
            @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .scrolling-content {
                animation: scroll 40s linear infinite;
            }
        `}</style>
        <div className="flex items-center scrolling-content">
            {tickerContent.map((edge, index) => (
                <TickerItem key={`${index}-${edge.player}`} edge={edge} />
            ))}
        </div>
    </div>
  );
};

export default EdgeTicker;