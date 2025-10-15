import React from 'react';

const NflHelmet: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <style>{`
        .helmet-shell { fill: hsl(var(--team-primary)); }
        .helmet-stripe { fill: hsl(var(--team-secondary)); }
        .helmet-facemask { stroke: hsl(var(--muted-foreground)); }
    `}</style>
    <path
      className="helmet-shell"
      d="M50,5 C25,5 5,25 5,50 C5,75 25,95 50,95 L85,95 C95,95 95,85 95,80 L95,40 C95,20 80,5 50,5 Z"
    />
    <path
      className="helmet-stripe"
      d="M45,5 L55,5 L55,92 C55,92 50,95 45,92 Z"
    />
    <g className="helmet-facemask" fill="none" strokeWidth="4" strokeLinecap="round">
      <path d="M92,50 C80,50 75,65 75,75" />
      <path d="M94,60 C85,60 80,70 80,80" />
      <path d="M75,75 H 80" />
    </g>
  </svg>
);

export default NflHelmet;