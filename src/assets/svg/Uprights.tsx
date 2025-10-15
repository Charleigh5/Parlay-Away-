import React from 'react';

const Uprights: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round">
      <path d="M100 200 V 100" />
      <path d="M100 100 H 20 V 10" />
      <path d="M100 100 H 180 V 10" />
    </g>
  </svg>
);

export default Uprights;