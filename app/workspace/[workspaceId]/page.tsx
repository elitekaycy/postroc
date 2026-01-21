'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/lib/store/workspace-store';

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaces, setActiveWorkspace } = useWorkspaceStore();

  useEffect(() => {
    params.then(({ workspaceId }) => {
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (workspace) {
        setActiveWorkspace(workspaceId);
      }
    });
  }, [params, workspaces, setActiveWorkspace]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Select a Project
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a project from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
