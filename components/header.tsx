'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { EnvironmentSwitcher } from './environment-switcher';

export function Header() {
  const { getActiveCategory } = useWorkspaceStore();
  const category = getActiveCategory();

  return (
    <header className="h-10 border-b border-[var(--border)] flex items-center justify-between px-4">
      <div className="text-xs text-gray-400">
        {category ? category.name : 'PostRoc'}
      </div>
      <EnvironmentSwitcher />
    </header>
  );
}
