import React from 'react';

export const LionHead: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <style>{`
        .lion-mane { fill: hsl(var(--team-secondary)); }
        .lion-face { fill: hsl(var(--foreground)); }
        .lion-accent { fill: hsl(var(--team-accent)); }
    `}</style>
    <path className="lion-mane" d="M50 0 L95 25 L85 50 L95 75 L50 100 L5 75 L15 50 L5 25 Z" />
    <circle className="lion-face" cx="50" cy="50" r="30" />
    <path className="lion-accent" d="M50 65 Q 40 75 30 65 C 35 80 65 80 70 65 Q 60 75 50 65 Z" />
    <circle fill="black" cx="38" cy="45" r="5" />
    <circle fill="black" cx="62" cy="45" r="5" />
    <polygon fill="black" points="45,55 55,55 50,65" />
  </svg>
);