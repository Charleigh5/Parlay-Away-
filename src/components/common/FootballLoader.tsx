import React from 'react';

const FootballLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <style>{`
        @keyframes spiral {
          0% {
            transform: rotate(0deg) translateX(5px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(5px) rotate(-360deg);
          }
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .football-spiral {
          animation: spiral 1s linear infinite;
        }
        .football-wobble {
            animation: wobble 0.5s ease-in-out infinite;
        }
      `}</style>
      <div className="football-wobble">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 60"
            className="w-16 h-auto football-spiral"
            style={{
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
            }}
          >
            <ellipse cx="50" cy="30" rx="48" ry="28" fill="hsl(var(--muted-foreground))" />
            <path d="M 50 2 L 50 58" stroke="white" strokeWidth="2" />
            <path d="M 10 30 C 20 20, 35 20, 50 30 S 80 40, 90 30" stroke="hsl(var(--team-accent))" strokeWidth="2" fill="none" />
          </svg>
      </div>
    </div>
  );
};

export default FootballLoader;