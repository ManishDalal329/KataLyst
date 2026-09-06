import React from 'react';

interface LogoProps {
  className?: string;
}

export const KatalystLogo: React.FC<LogoProps> = ({ className = 'h-8 w-auto' }) => (
  <svg
    viewBox="0 0 180 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="KataLyst Logo"
  >
    <g transform="translate(0, 0) scale(0.4)">
      <circle cx="50" cy="50" r="48" fill="#8B7355" />
      <rect x="31" y="24" width="9" height="52" rx="4.5" fill="#FAF8F5" />
      <path d="M35.5 50L68 30" stroke="#FAF8F5" strokeWidth="9" strokeLinecap="round" />
      <circle cx="69" cy="29" r="7" fill="#FAF8F5" />
      <path d="M35.5 50L68 70" stroke="#FAF8F5" strokeWidth="9" strokeLinecap="round" />
      <circle cx="69" cy="71" r="7" fill="#FAF8F5" />
      <circle cx="35.5" cy="50" r="7.5" fill="#F4EFEA" />
    </g>
    <text
      x="48"
      y="28"
      fontFamily="'Plus Jakarta Sans', Outfit, Inter, system-ui, sans-serif"
      fontWeight="800"
      fontSize="26"
      letterSpacing="-0.03em"
    >
      <tspan fill="currentColor">Kata</tspan>
      <tspan fill="#8B7355">Lyst</tspan>
    </text>
  </svg>
);

export const KatalystIcon: React.FC<LogoProps> = ({ className = 'h-8 w-8' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="KataLyst Icon"
  >
    <circle cx="50" cy="50" r="48" fill="#8B7355" />
    <rect x="31" y="24" width="9" height="52" rx="4.5" fill="#FAF8F5" />
    <path d="M35.5 50L68 30" stroke="#FAF8F5" strokeWidth="9" strokeLinecap="round" />
    <circle cx="69" cy="29" r="7" fill="#FAF8F5" />
    <path d="M35.5 50L68 70" stroke="#FAF8F5" strokeWidth="9" strokeLinecap="round" />
    <circle cx="69" cy="71" r="7" fill="#FAF8F5" />
    <circle cx="35.5" cy="50" r="7.5" fill="#F4EFEA" />
  </svg>
);
