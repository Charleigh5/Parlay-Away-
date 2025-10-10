import React from 'react';

export const ShapesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="m21.28 12-4.28-10-8 2 4.28 10 8-2z" />
    <path d="M6.34 17.94 2 22l8.5-2.5" />
    <path d="M12.15 10.65 14 6.15l-4.2-2.5" />
  </svg>
);