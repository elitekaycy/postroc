'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { CategoryConfig } from '@/components/category/category-config';
import { CustomEditor } from '@/components/custom/custom-editor';

export default function Home() {
  const router = useRouter();
  const {
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    activeCustomId,
    workspaces,
    getActiveCustom,
    getActiveCategory,
  } = useWorkspaceStore();
  const activeCustom = getActiveCustom();
  const activeCategory = getActiveCategory();

  // Redirect to the current active route if state exists
  useEffect(() => {
    if (!activeWorkspaceId) return;

    if (activeCustomId && activeCustom) {
      // Find the project and optionally category for this custom
      const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
      if (!workspace) return;

      for (const project of workspace.projects) {
        // Check project-level customs
        if (project.customs.find((c) => c.id === activeCustomId)) {
          router.replace(`/workspace/${activeWorkspaceId}/${project.id}/${activeCustomId}`);
          return;
        }
        // Check category customs
        for (const category of project.categories) {
          if (category.customs.find((c) => c.id === activeCustomId)) {
            router.replace(`/workspace/${activeWorkspaceId}/${project.id}/${category.id}/${activeCustomId}`);
            return;
          }
        }
      }
    } else if (activeCategoryId && activeCategory) {
      const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
      if (!workspace) return;

      for (const project of workspace.projects) {
        if (project.categories.find((c) => c.id === activeCategoryId)) {
          router.replace(`/workspace/${activeWorkspaceId}/${project.id}/${activeCategoryId}`);
          return;
        }
      }
    } else if (activeProjectId) {
      router.replace(`/workspace/${activeWorkspaceId}/${activeProjectId}`);
    } else {
      router.replace(`/workspace/${activeWorkspaceId}`);
    }
  }, []);

  // While redirecting or if there's active state, show loading or the content
  if (activeCustomId && activeCustom) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-4 flex-shrink-0">{activeCustom.name}</h2>
        <div className="flex-1 min-h-0">
          <CustomEditor customId={activeCustomId} />
        </div>
      </div>
    );
  }

  if (activeCategoryId && activeCategory) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6">Category Configuration</h2>
        <CategoryConfig categoryId={activeCategoryId} />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="max-w-2xl text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to PostRoc
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Composable API data & request orchestration platform
          </p>
          <div className="pt-8 space-y-2 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get started by creating a workspace from the sidebar.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Then organize your API requests with Projects, Categories, and Customs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Select a Project
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a project from the sidebar to get started with your API development.
        </p>
      </div>
    </div>
  );
}
