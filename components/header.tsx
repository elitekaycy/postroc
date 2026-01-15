'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { Plus, FolderPlus, LayoutGrid, FileText } from 'lucide-react';
import type { Environment } from '@/lib/types/core';

export function Header() {
  const {
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    getActiveCategory,
    setActiveEnvironment,
    createProject,
    createCategory,
    createCustom,
  } = useWorkspaceStore();

  const activeCategory = getActiveCategory();

  const getEnvironmentColor = (env: Environment): string => {
    switch (env) {
      case 'local':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'production':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">PostRoc</h1>

        {activeCategory && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Environment:</span>
            <select
              value={activeCategory.config.activeEnvironment}
              onChange={(e) => setActiveEnvironment(activeCategory.id, e.target.value as Environment)}
              className={`text-xs px-2 py-1 rounded font-medium border-none outline-none cursor-pointer ${getEnvironmentColor(
                activeCategory.config.activeEnvironment
              )}`}
            >
              {activeCategory.config.environments.map((env) => (
                <option key={env.name} value={env.name}>
                  {env.name.charAt(0).toUpperCase() + env.name.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
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
