'use client';

import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/store/workspace-store';
import {
  downloadExport,
  generateExportFilename,
  type ExportType,
} from '@/lib/export/workspace-export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const {
    workspaces,
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    exportWorkspaceToJSON,
    exportProjectToJSON,
    exportCategoryToJSON,
  } = useWorkspaceStore();

  const [exportType, setExportType] = useState<ExportType>('workspace');
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeProject = activeWorkspace?.projects.find((p) => p.id === activeProjectId);
  const activeCategory = activeProject?.categories.find((c) => c.id === activeCategoryId);

  const canExportWorkspace = !!activeWorkspace;
  const canExportProject = !!activeProject;
  const canExportCategory = !!activeCategory;

  const getExportName = (): string => {
    if (exportType === 'workspace' && activeWorkspace) return activeWorkspace.name;
    if (exportType === 'project' && activeProject) return activeProject.name;
    if (exportType === 'category' && activeCategory) return activeCategory.name;
    return 'export';
  };

  const handleExport = () => {
    setIsExporting(true);

    try {
      let json: string | null = null;

      if (exportType === 'workspace' && activeWorkspaceId) {
        json = exportWorkspaceToJSON(activeWorkspaceId, includeSecrets);
      } else if (exportType === 'project' && activeProjectId) {
        json = exportProjectToJSON(activeProjectId, includeSecrets);
      } else if (exportType === 'category' && activeCategoryId) {
        json = exportCategoryToJSON(activeCategoryId, includeSecrets);
      }

      if (json) {
        const filename = generateExportFilename(getExportName(), exportType);
        downloadExport(json, filename);
        onClose();
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium">Export</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--hover)] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-[var(--muted)] mb-2 block">What to export</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-2 p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--hover)] ${!canExportWorkspace ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="exportType"
                  value="workspace"
                  checked={exportType === 'workspace'}
                  onChange={() => setExportType('workspace')}
                  disabled={!canExportWorkspace}
                  className="w-3 h-3"
                />
                <div className="flex-1">
                  <span className="text-xs font-medium">Entire Workspace</span>
                  {activeWorkspace && (
                    <span className="text-[10px] text-[var(--muted)] ml-2">
                      ({activeWorkspace.projects.length} projects)
                    </span>
                  )}
                </div>
              </label>

              <label className={`flex items-center gap-2 p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--hover)] ${!canExportProject ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="exportType"
                  value="project"
                  checked={exportType === 'project'}
                  onChange={() => setExportType('project')}
                  disabled={!canExportProject}
                  className="w-3 h-3"
                />
                <div className="flex-1">
                  <span className="text-xs font-medium">Current Project</span>
                  {activeProject && (
                    <span className="text-[10px] text-[var(--muted)] ml-2">
                      {activeProject.name}
                    </span>
                  )}
                </div>
              </label>

              <label className={`flex items-center gap-2 p-2 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--hover)] ${!canExportCategory ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="exportType"
                  value="category"
                  checked={exportType === 'category'}
                  onChange={() => setExportType('category')}
                  disabled={!canExportCategory}
                  className="w-3 h-3"
                />
                <div className="flex-1">
                  <span className="text-xs font-medium">Current Category</span>
                  {activeCategory && (
                    <span className="text-[10px] text-[var(--muted)] ml-2">
                      {activeCategory.name}
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSecrets}
                onChange={(e) => setIncludeSecrets(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-xs">Include auth tokens and passwords</span>
            </label>
            <p className="text-[10px] text-[var(--muted)] mt-1 ml-5">
              Leave unchecked for safe sharing
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--hover)]"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
