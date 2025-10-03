import React from 'react';

export const LandmarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" x2="21" y1="22" />
    <line x1="6" x2="6" y1="18" />
    <line x1="10" x2="10" y1="18" />
    <line x1="14" x2="14" y1="18" />
    <line x1="18" x2="18" y1="18" />
    <polygon points="5 22 5 12 12 2 19 12 19 22" />
  </svg>
);