import React, { useState, useEffect } from 'react';
import { getGreeting } from '../../utils/time';
import { useTeamTheme } from '../../hooks/useTeamTheme';

const Hero: React.FC = () => {
  const [greeting, setGreeting] = useState('');
  const { selectedTeam } = useTeamTheme();

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);
  
  const Logo = () => <img src={`src/assets/logos/${selectedTeam.id}.svg`} alt={`${selectedTeam.name} logo`} className="h-24 w-24 md:h-32 md:w-32 object-contain" />;

  return (
    <div 
      className="relative rounded-xl p-8 md:p-12 min-h-[200px] flex flex-col md:flex-row justify-between items-center text-white overflow-hidden bg-cover bg-center shadow-2xl"
      style={{ 
        backgroundImage: 'var(--hero-image)',
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative z-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {greeting}, Chris.
        </h1>
        <p className="mt-2 text-lg md:text-xl text-gray-300 max-w-2xl">
          Here's your edge for the {selectedTeam.name}. The AI has identified the sharpest angles in the market.
        </p>
      </div>
       <div className="relative z-10 mt-6 md:mt-0">
        <Logo />
      </div>
    </div>
  );
};

export default Hero;
