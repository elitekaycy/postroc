'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { CategoryConfig } from '@/components/category/category-config';

export default function Home() {
  const { activeCategoryId, activeCustomId, workspaces } = useWorkspaceStore();

  if (activeCustomId) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6">Custom Editor</h2>
        <p className="text-gray-500">Custom editor coming in Phase 3...</p>
      </div>
    );
  }

  if (activeCategoryId) {
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
          Select a Category
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a category from the sidebar to configure its environments, authentication, and headers.
        </p>
      </div>
    </div>
  );
}
