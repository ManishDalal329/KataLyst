import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
      }}
      className="flex items-center justify-center p-2 rounded-full hover:opacity-80 transition-all shrink-0 cursor-pointer shadow-sm"
    >
      {theme === 'light' ? (
        <Moon size={16} style={{ color: 'var(--accent)' }} />
      ) : (
        <Sun size={16} style={{ color: 'var(--accent)' }} />
      )}
    </button>
  );
};

export default ThemeToggle;
