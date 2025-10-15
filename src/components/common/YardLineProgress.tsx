import React from 'react';

interface YardLineProgressProps {
  currentStep: number;
  totalSteps: number;
}

const YardLineProgress: React.FC<YardLineProgressProps> = ({ currentStep, totalSteps }) => {
  const progress = totalSteps > 1 ? (currentStep - 1) / (totalSteps - 1) : 1;
  const progressPercent = Math.min(100, progress * 100);

  // Metaphor: Drive from your own 20 to opponent's 0 (end zone)
  const yardsGained = progress * 80;
  const currentYardLine = 20 + yardsGained;
  const displayYardLine = currentYardLine > 50 ? 100 - currentYardLine : currentYardLine;

  const getDownAndDistanceText = () => {
    if (progress >= 1) return "Touchdown!";
    if (progress >= 0.9) return "Goal to Go";
    const down = Math.floor(progress * 4) + 1;
    return `${down === 1 ? '1st' : down === 2 ? '2nd' : down === 3 ? '3rd' : '4th'} & ${Math.max(1, 10 - Math.round((progress * 4 % 1) * 10))}`;
  };

  return (
    <div>
      <div className="mb-2 flex justify-between items-baseline">
        <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{getDownAndDistanceText()}</p>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          On the {Math.round(displayYardLine)} yard line
        </p>
      </div>
      <div 
        className="relative h-8 w-full rounded-md overflow-hidden"
        style={{ 
            backgroundColor: 'hsl(var(--secondary))',
            backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '10% 100%, 50% 100%',
        }}
      >
        <div 
          className="absolute left-0 top-0 h-full transition-all duration-500 ease-out"
          style={{ 
              width: `${progressPercent}%`,
              backgroundColor: 'hsl(var(--team-primary))',
              opacity: 0.7
          }}
        />
         <div className="absolute inset-0 flex items-center justify-center">
            <svg width="100%" height="100%" className="text-white/50">
                {[...Array(9)].map((_, i) => (
                    <text key={i} x={`${(i + 1) * 10}%`} y="65%" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">
                        {i < 5 ? (i + 1) * 10 : (9 - i) * 10}
                    </text>
                ))}
            </svg>
        </div>
      </div>
    </div>
  );
};

export default YardLineProgress;