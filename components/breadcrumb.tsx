'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { useNavigation } from '@/lib/hooks/use-navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export function Breadcrumb() {
  const {
    workspaces,
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    activeCustomId,
    getActiveCustom,
  } = useWorkspaceStore();

  const { navigateToWorkspace, navigateToProject, navigateToCategory } = useNavigation();

  const items: BreadcrumbItem[] = [];

  // Find active workspace
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  if (activeWorkspace) {
    items.push({
      label: activeWorkspace.name,
      onClick: () => navigateToWorkspace(activeWorkspace.id),
    });

    // Find active project
    const activeProject = activeWorkspace.projects.find((p) => p.id === activeProjectId);
    if (activeProject) {
      items.push({
        label: activeProject.name,
        onClick: () => navigateToProject(activeProject.id),
      });

      // Find active category
      const activeCategory = activeProject.categories.find((c) => c.id === activeCategoryId);
      if (activeCategory) {
        items.push({
          label: activeCategory.name,
          onClick: () => navigateToCategory(activeCategory.id),
        });

        // Find custom in category
        const activeCustom = getActiveCustom();
        if (activeCustomId && activeCustom) {
          const categoryCustom = activeCategory.customs.find((c) => c.id === activeCustomId);
          if (categoryCustom) {
            items.push({
              label: categoryCustom.name,
              isCurrent: true,
            });
          }
        }
      } else if (activeCustomId) {
        // Project-level custom
        const activeCustom = getActiveCustom();
        if (activeCustom) {
          const projectCustom = activeProject.customs.find((c) => c.id === activeCustomId);
          if (projectCustom) {
            items.push({
              label: projectCustom.name,
              isCurrent: true,
            });
          } else {
            // Check if custom is inside any category
            for (const category of activeProject.categories) {
              const catCustom = category.customs.find((c) => c.id === activeCustomId);
              if (catCustom) {
                items.push({
                  label: category.name,
                  onClick: () => navigateToCategory(category.id),
                });
                items.push({
                  label: catCustom.name,
                  isCurrent: true,
                });
                break;
              }
            }
          }
        }
      }
    }
  }

  // Mark last item as current if not already marked
  if (items.length > 0 && !items.some((item) => item.isCurrent)) {
    items[items.length - 1].isCurrent = true;
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Home className="w-3 h-3" />
        <span>PostRoc</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-xs">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3 h-3 text-gray-500" />}
          {item.onClick && !item.isCurrent ? (
            <button
              onClick={item.onClick}
              className="text-gray-400 hover:text-gray-200 transition-colors truncate max-w-[120px]"
              title={item.label}
            >
              {item.label}
            </button>
          ) : (
            <span
              className={`truncate max-w-[150px] ${item.isCurrent ? 'text-gray-200 font-medium' : 'text-gray-400'}`}
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
