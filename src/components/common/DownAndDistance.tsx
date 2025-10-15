import React from 'react';

interface DownAndDistanceProps {
  currentStep: number;
  totalSteps: number;
}

const DownAndDistance: React.FC<DownAndDistanceProps> = ({ currentStep, totalSteps }) => {
  const getDownText = () => {
    if (currentStep > totalSteps) return `${totalSteps}th`;
    switch (currentStep) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
      case 4: return '4th';
      default: return `${currentStep}th`;
    }
  };

  const getDistanceText = () => {
    if (currentStep >= totalSteps) return 'GOAL';
    return Math.max(1, 10 - Math.round(((currentStep-1)/(totalSteps-1) % 0.25) * 10 * 4));
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>DOWN</p>
        <p className="text-4xl font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>{getDownText()}</p>
      </div>
      <div className="text-4xl font-light" style={{ color: 'hsl(var(--border))' }}>&</div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>TO GO</p>
        <p className="text-4xl font-extrabold text-yellow-400">{getDistanceText()}</p>
      </div>
    </div>
  );
};

export default DownAndDistance;