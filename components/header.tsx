'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { Plus, FolderPlus, LayoutGrid } from 'lucide-react';
import { EnvironmentSwitcher } from './environment-switcher';

export function Header() {
  const {
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    createProject,
    createCategory,
    createCustom,
  } = useWorkspaceStore();

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">PostRoc</h1>
        <EnvironmentSwitcher />
      </div>

      <div className="flex items-center gap-2">
        {activeWorkspaceId && (
          <button
            onClick={() => activeWorkspaceId && createProject(activeWorkspaceId, 'New Project')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
            title="Create Project"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Project</span>
          </button>
        )}

        {activeProjectId && (
          <button
            onClick={() => activeProjectId && createCategory(activeProjectId, 'New Category')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
            title="Create Category"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Category</span>
          </button>
        )}

        {activeCategoryId && (
          <button
            onClick={() => activeCategoryId && createCustom(activeCategoryId, 'New Custom')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            title="Create Custom"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Custom</span>
          </button>
        )}
      </div>
    </header>
  );
}
