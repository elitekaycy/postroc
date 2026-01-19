'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { useTheme } from '@/lib/hooks/use-theme';
import { Sun, Moon } from 'lucide-react';

export function Header() {
  const { getActiveCategory } = useWorkspaceStore();
  const category = getActiveCategory();
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <header className="h-10 border-b border-[var(--border)] flex items-center justify-between px-4">
      <div className="text-xs text-gray-400">
        {category ? category.name : 'PostRoc'}
      </div>
      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-[var(--hover)] rounded-md transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
