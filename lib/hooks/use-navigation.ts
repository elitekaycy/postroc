'use client';

import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/lib/store/workspace-store';

export function useNavigation() {
  const router = useRouter();
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();

  const navigateToWorkspace = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}`);
  };

  const navigateToProject = (projectId: string) => {
    if (!activeWorkspaceId) return;
    router.push(`/workspace/${activeWorkspaceId}/${projectId}`);
  };

  const navigateToCategory = (categoryId: string) => {
    if (!activeWorkspaceId) return;

    // Find the project that contains this category
    const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!workspace) return;

    for (const project of workspace.projects) {
      const category = project.categories.find((c) => c.id === categoryId);
      if (category) {
        router.push(`/workspace/${activeWorkspaceId}/${project.id}/${categoryId}`);
        return;
      }
    }
  };

  const navigateToCustom = (customId: string) => {
    if (!activeWorkspaceId) return;

    const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!workspace) return;

    for (const project of workspace.projects) {
      // Check project-level customs
      const projectCustom = project.customs.find((c) => c.id === customId);
      if (projectCustom) {
        router.push(`/workspace/${activeWorkspaceId}/${project.id}/${customId}`);
        return;
      }

      // Check category customs
      for (const category of project.categories) {
        const categoryCustom = category.customs.find((c) => c.id === customId);
        if (categoryCustom) {
          router.push(`/workspace/${activeWorkspaceId}/${project.id}/${category.id}/${customId}`);
          return;
        }
      }
    }
  };

  const navigateHome = () => {
    router.push('/');
  };

  return {
    navigateToWorkspace,
    navigateToProject,
    navigateToCategory,
    navigateToCustom,
    navigateHome,
  };
}
