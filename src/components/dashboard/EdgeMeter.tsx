import React, { useEffect } from 'react';
import Gauge from '../common/Gauge';
import { useMarketInefficiency } from '../../hooks/useMarketInefficiency';
import { useCelebration } from '../../contexts/CelebrationProvider';
import FootballLoader from '../common/FootballLoader';

const EdgeMeter: React.FC = () => {
  const { value: inefficiencyLevel, isLoading, error } = useMarketInefficiency();
  const { triggerLionsRoar } = useCelebration();

  useEffect(() => {
    if (!isLoading && !error && inefficiencyLevel >= 0.75) {
      triggerLionsRoar();
    }
  }, [inefficiencyLevel, isLoading, error, triggerLionsRoar]);


  return (
    <div className="relative rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 overflow-hidden" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="absolute top-4 right-4 text-xs font-semibold uppercase px-2 py-1 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            High Edge
        </div>
        {isLoading ? (
             <div className="w-[120px] h-[120px] flex items-center justify-center rounded-full">
                 <FootballLoader />
            </div>
        ) : (
            <Gauge value={inefficiencyLevel} />
        )}
        <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--card-foreground))' }}>Market Inefficiency Meter</h2>
             {error ? (
                 <p className="text-lg mt-1 text-red-400">{error}</p>
            ) : (
                <>
                    <p className="text-lg mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span className="font-bold text-cyan-400">2.2x</span> more parlay edges open this Sunday vs weekday average.
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        The AI has detected significant discrepancies between market odds and its projections, indicating a high-value betting environment.
                    </p>
                </>
            )}
        </div>
        <style>{`
            @keyframes pulse-glow {
                0%, 100% { box-shadow: 0 0 10px 0px hsla(var(--primary), 0.3); }
                50% { box-shadow: 0 0 25px 8px hsla(var(--primary), 0.1); }
            }
            .pulse-animation {
                animation: pulse-glow 3s infinite ease-in-out;
            }
        `}</style>
        <div className="absolute inset-0 rounded-xl pulse-animation pointer-events-none"></div>
    </div>
  );
};

export default EdgeMeter;