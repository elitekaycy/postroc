'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/lib/store/workspace-store';

interface ProjectPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { workspaces, setActiveWorkspace, setActiveProject } = useWorkspaceStore();

  useEffect(() => {
    params.then(({ workspaceId, projectId }) => {
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (workspace) {
        setActiveWorkspace(workspaceId);
        const project = workspace.projects.find((p) => p.id === projectId);
        if (project) {
          setActiveProject(projectId);
        }
      }
    });
  }, [params, workspaces, setActiveWorkspace, setActiveProject]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Select a Category or Custom
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a category to configure it, or select a custom to edit its fields.
        </p>
      </div>
    </div>
  );
}
