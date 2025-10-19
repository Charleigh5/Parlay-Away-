
import React, { useEffect } from 'react';
import { useTeamTheme } from '../../hooks/useTeamTheme';
// FIX: The LionHead component is a named export, not a default export.
import { LionHead } from '../../assets/svg/LionHead';

interface LionsRoarProps {
  onComplete: () => void;
}

const LionsRoar: React.FC<LionsRoarProps> = ({ onComplete }) => {
  const { selectedTeam } = useTeamTheme();

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <style>{`
        @keyframes roar-effect {
          0% { transform: scale(0.5); opacity: 0; }
          20% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes sound-wave {
          0% { r: 0; opacity: 0.8; }
          100% { r: 200; opacity: 0; }
        }
        .animate-roar {
          animation: roar-effect 2s ease-out forwards;
        }
        .animate-wave {
          animation: sound-wave 1s ease-out forwards;
        }
      `}</style>
      <div className="relative animate-roar">
        <svg width="200" height="200" viewBox="0 0 200 200" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <circle cx="100" cy="100" fill="none" stroke="hsl(var(--team-primary))" strokeWidth="4" className="animate-wave" style={{ animationDelay: '0s' }} />
            <circle cx="100" cy="100" fill="none" stroke="hsl(var(--team-primary))" strokeWidth="2" className="animate-wave" style={{ animationDelay: '0.2s' }} />
        </svg>
        <LionHead className="w-48 h-48" />
      </div>
    </div>
  );
};

export default LionsRoar;