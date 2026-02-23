'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const subscribe = () => () => {};

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
    return stored || systemPreference;
  });
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  // Apply theme class on mount (DOM side-effect only — state set via lazy initializer)
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; theme is stable from lazy init
  }, []);

  // Intentional direct DOM manipulation — theme class must live on <html> to
  // drive CSS variable switching before React hydrates. The no-transition guard
  // prevents a flash when toggling.
  const setThemeValue = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.add('no-transition');
    document.documentElement.classList.toggle('light', newTheme === 'light');
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transition');
    });
  };

  // Prevent flash during SSR - show skeleton
  if (!mounted) {
    return (
      <div className="flex gap-1 p-1 bg-elevated rounded-lg">
        <div className="flex-1 p-2 rounded-md bg-hover">
          <Moon className="size-4 text-muted-foreground mx-auto" strokeWidth={1.5} />
        </div>
        <div className="flex-1 p-2 rounded-md">
          <Sun className="size-4 text-muted-foreground mx-auto" strokeWidth={1.5} />
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
      <Button
        variant="ghost"
        onClick={() => setThemeValue('dark')}
        className={cn(
          "flex-1 h-auto p-2 rounded-md",
          "pressable",
          theme === 'dark'
            ? "bg-hover text-foreground shadow-sm hover:bg-hover"
            : "text-muted-foreground hover:text-foreground hover:bg-transparent"
        )}
        aria-label="Dark mode"
        aria-checked={theme === 'dark'}
        role="radio"
      >
        <Moon className="size-4" strokeWidth={1.5} />
      </Button>

      {/* Light mode button */}
      <Button
        variant="ghost"
        onClick={() => setThemeValue('light')}
        className={cn(
          "flex-1 h-auto p-2 rounded-md",
          "pressable",
          theme === 'light'
            ? "bg-hover text-foreground shadow-sm hover:bg-hover"
            : "text-muted-foreground hover:text-foreground hover:bg-transparent"
        )}
        aria-label="Light mode"
        aria-checked={theme === 'light'}
        role="radio"
      >
        <Sun className="size-4" strokeWidth={1.5} />
      </Button>
    </div>
  );
}