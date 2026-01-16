'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { EnvironmentSwitcher } from './environment-switcher';

export function Header() {
  const { getActiveCategory, getActiveCustom } = useWorkspaceStore();
  const category = getActiveCategory();
  const custom = getActiveCustom();

  return (
    <header className="h-12 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500">PostRoc</span>
        {(category || custom) && (
          <span className="text-gray-300 dark:text-gray-600">/</span>
        )}
        {category && (
          <span className="text-sm font-medium">{category.name}</span>
        )}
        {custom && !category && (
          <span className="text-sm font-medium">{custom.name}</span>
        )}
      </div>

      <EnvironmentSwitcher />
    </header>
  );
}
