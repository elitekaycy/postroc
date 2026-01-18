'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import type { Environment } from '@/lib/types/core';

export function EnvironmentSwitcher() {
  const { getActiveCategory, setActiveEnvironment, activeCategoryId } = useWorkspaceStore();
  const category = getActiveCategory();

  if (!category) {
    return null;
  }

  const { config } = category;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (activeCategoryId) {
      setActiveEnvironment(activeCategoryId, e.target.value as Environment);
    }
  };

  return (
    <select
      value={config.activeEnvironment}
      onChange={handleChange}
      className="h-6 px-1.5 text-[10px] border border-[var(--border)] rounded bg-[var(--background)]"
    >
      {config.environments.map((env) => (
        <option key={env.name} value={env.name}>
          {env.name}
        </option>
      ))}
    </select>
  );
}
