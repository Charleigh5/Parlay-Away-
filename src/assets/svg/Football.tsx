import React from 'react';

const Football: React.FC<{ accentColor?: string }> = ({ accentColor = 'white' }) => (
    <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="30" rx="48" ry="28" fill="#6B4F35" />
        <path d="M 50 2 L 50 58" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M 10 30 C 20 20, 35 20, 50 30 S 80 40, 90 30" stroke={accentColor} strokeWidth="2" fill="none" />
    </svg>
);

export default Football;