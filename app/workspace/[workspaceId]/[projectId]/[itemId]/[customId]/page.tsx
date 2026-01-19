'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { CustomEditor } from '@/components/custom/custom-editor';

interface CategoryCustomPageProps {
  params: Promise<{
    workspaceId: string;
    projectId: string;
    itemId: string; // This is the categoryId
    customId: string;
  }>;
}

export default function CategoryCustomPage({ params }: CategoryCustomPageProps) {
  const {
    workspaces,
    setActiveWorkspace,
    setActiveProject,
    setActiveCustom,
    getActiveCustom,
  } = useWorkspaceStore();

  const [resolvedCustomId, setResolvedCustomId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ workspaceId, projectId, customId }) => {
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (!workspace) return;

      setActiveWorkspace(workspaceId);
      const project = workspace.projects.find((p) => p.id === projectId);
      if (!project) return;

      setActiveProject(projectId);
      setActiveCustom(customId);
      setResolvedCustomId(customId);
    });
  }, [params, workspaces, setActiveWorkspace, setActiveProject, setActiveCustom]);

  const activeCustom = getActiveCustom();

  if (activeCustom && resolvedCustomId === activeCustom.id) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-4 flex-shrink-0">{activeCustom.name}</h2>
        <div className="flex-1 min-h-0">
          <CustomEditor customId={resolvedCustomId} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
