import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { SunIcon } from '../../assets/icons/SunIcon';
import { MoonIcon } from '../../assets/icons/MoonIcon';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors"
      style={{
        borderColor: 'hsl(var(--border))',
        backgroundColor: 'hsl(var(--accent))',
        color: 'hsl(var(--accent-foreground))'
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <SunIcon className={`h-5 w-5 transition-all ${theme === 'light' ? 'scale-100' : 'scale-0'}`} />
      <MoonIcon className={`absolute h-5 w-5 transition-all ${theme === 'dark' ? 'scale-100' : 'scale-0'}`} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;
