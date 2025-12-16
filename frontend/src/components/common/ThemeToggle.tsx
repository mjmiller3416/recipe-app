'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
    
    // Check localStorage or system preference on mount
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches 
      ? 'light' 
      : 'dark';
    const initial = stored || systemPreference;
    
    setTheme(initial);
    document.documentElement.classList.toggle('light', initial === 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  // Prevent flash during SSR
  if (!mounted) {
    return (
      <button
        className="p-2.5 rounded-lg bg-elevated hover:bg-hover transition-colors"
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="w-5 h-5 text-muted" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-lg bg-elevated hover:bg-hover transition-colors group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
      ) : (
        <Moon className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
      )}
    </button>
  );
}