'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { CategoryConfig } from '@/components/category/category-config';
import { CustomEditor } from '@/components/custom/custom-editor';

interface ItemPageProps {
  params: Promise<{ workspaceId: string; projectId: string; itemId: string }>;
}

export default function ItemPage({ params }: ItemPageProps) {
  const {
    workspaces,
    setActiveWorkspace,
    setActiveProject,
    setActiveCategory,
    setActiveCustom,
    getActiveCategory,
    getActiveCustom,
  } = useWorkspaceStore();

  const [itemType, setItemType] = useState<'category' | 'custom' | null>(null);
  const [resolvedItemId, setResolvedItemId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ workspaceId, projectId, itemId }) => {
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (!workspace) return;

      setActiveWorkspace(workspaceId);
      const project = workspace.projects.find((p) => p.id === projectId);
      if (!project) return;

      setActiveProject(projectId);

      // Check if itemId is a category or custom
      const category = project.categories.find((c) => c.id === itemId);
      if (category) {
        setActiveCategory(itemId);
        setItemType('category');
        setResolvedItemId(itemId);
        return;
      }

      // Check project-level customs
      const custom = project.customs.find((c) => c.id === itemId);
      if (custom) {
        setActiveCustom(itemId);
        setItemType('custom');
        setResolvedItemId(itemId);
        return;
      }

      // Check customs inside categories
      for (const cat of project.categories) {
        const categoryCustom = cat.customs.find((c) => c.id === itemId);
        if (categoryCustom) {
          setActiveCustom(itemId);
          setItemType('custom');
          setResolvedItemId(itemId);
          return;
        }
      }
    });
  }, [params, workspaces, setActiveWorkspace, setActiveProject, setActiveCategory, setActiveCustom]);

  const activeCategory = getActiveCategory();
  const activeCustom = getActiveCustom();

  if (itemType === 'category' && activeCategory && resolvedItemId === activeCategory.id) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6">Category Configuration</h2>
        <CategoryConfig categoryId={resolvedItemId} />
      </div>
    );
  }

  if (itemType === 'custom' && activeCustom && resolvedItemId === activeCustom.id) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-4 flex-shrink-0">{activeCustom.name}</h2>
        <div className="flex-1 min-h-0">
          <CustomEditor customId={resolvedItemId} />
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
