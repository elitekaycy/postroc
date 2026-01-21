'use client';

import { useTheme } from '@/lib/hooks/use-theme';
import { Breadcrumb } from '@/components/breadcrumb';
import { Sun, Moon } from 'lucide-react';

export function Header() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <div className="flex-1 flex items-center justify-between">
      <Breadcrumb />
      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
