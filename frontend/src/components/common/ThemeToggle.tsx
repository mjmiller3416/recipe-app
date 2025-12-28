'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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

  const setThemeValue = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  // Prevent flash during SSR - show skeleton
  if (!mounted) {
    return (
      <div className="flex gap-1 p-1 bg-elevated rounded-lg">
        <div className="flex-1 p-2 rounded-md bg-hover">
          <Moon className="w-4 h-4 text-muted mx-auto" />
        </div>
        <div className="flex-1 p-2 rounded-md">
          <Sun className="w-4 h-4 text-muted mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-1 p-1 bg-elevated rounded-lg"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {/* Dark mode button */}
      <button
        onClick={() => setThemeValue('dark')}
        className={cn(
          "flex-1 p-2 rounded-md flex items-center justify-center",
          "pressable",
          theme === 'dark'
            ? "bg-hover text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        )}
        aria-label="Dark mode"
        aria-checked={theme === 'dark'}
        role="radio"
      >
        <Moon className="w-4 h-4" strokeWidth={1.5} />
      </button>

      {/* Light mode button */}
      <button
        onClick={() => setThemeValue('light')}
        className={cn(
          "flex-1 p-2 rounded-md flex items-center justify-center",
          "pressable",
          theme === 'light'
            ? "bg-hover text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        )}
        aria-label="Light mode"
        aria-checked={theme === 'light'}
        role="radio"
      >
        <Sun className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}