'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { ChevronDown, ChevronRight, FolderIcon, LayoutGrid, FileText } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const {
    workspaces,
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    activeCustomId,
    setActiveProject,
    setActiveCategory,
    setActiveCustom,
    createWorkspace,
  } = useWorkspaceStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  if (workspaces.length === 0) {
    return (
      <div className="w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] p-4 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 mb-4">No workspaces yet</p>
        <button
          onClick={() => createWorkspace('My Workspace')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Create Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {activeWorkspace?.name || 'Workspace'}
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {activeWorkspace?.projects.map((project) => (
          <div key={project.id} className="mb-2">
            <button
              onClick={() => {
                toggleProject(project.id);
                setActiveProject(project.id);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-[var(--hover)] ${
                activeProjectId === project.id ? 'bg-[var(--hover)]' : ''
              }`}
            >
              {expandedProjects.has(project.id) ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              <FolderIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.name}</span>
            </button>

            {expandedProjects.has(project.id) && (
              <div className="ml-6 mt-1 space-y-1">
                {project.categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => {
                        toggleCategory(category.id);
                        setActiveCategory(category.id);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-[var(--hover)] ${
                        activeCategoryId === category.id ? 'bg-[var(--hover)] font-medium' : ''
                      }`}
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{category.name}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {category.customs.length}
                      </span>
                    </button>

                    {expandedCategories.has(category.id) && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {category.customs.map((custom) => (
                          <button
                            key={custom.id}
                            onClick={() => setActiveCustom(custom.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-[var(--hover)] ${
                              activeCustomId === custom.id ? 'bg-[var(--hover)] font-medium' : ''
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{custom.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
