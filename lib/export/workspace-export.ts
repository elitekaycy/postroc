import type { Workspace, Project, Category } from '@/lib/types/core';

// Export file format version
export const EXPORT_VERSION = '1.0.0';

export type ExportType = 'workspace' | 'project' | 'category';

export interface PostrocExport {
  version: string;
  exportedAt: number;
  type: ExportType;
  data: Workspace | Project | Category;
}

export interface ExportOptions {
  type: ExportType;
  includeSecrets?: boolean;
}

const SENSITIVE_FIELDS = ['token', 'apiKeyValue', 'password'];

/**
 * Recursively strip sensitive data from an object
 */
function stripSensitiveData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => stripSensitiveData(item)) as T;
  }

  const result = { ...data } as Record<string, unknown>;

  for (const key of Object.keys(result)) {
    if (SENSITIVE_FIELDS.includes(key) && typeof result[key] === 'string') {
      result[key] = '';
    } else if (typeof result[key] === 'object') {
      result[key] = stripSensitiveData(result[key]);
    }
  }

  return result as T;
}

/**
 * Find a workspace by ID
 */
function findWorkspace(workspaces: Workspace[], id: string): Workspace | null {
  return workspaces.find((w) => w.id === id) || null;
}

/**
 * Find a project by ID across all workspaces
 */
function findProject(workspaces: Workspace[], id: string): Project | null {
  for (const workspace of workspaces) {
    const project = workspace.projects.find((p) => p.id === id);
    if (project) return project;
  }
  return null;
}

/**
 * Find a category by ID across all workspaces and projects
 */
function findCategory(workspaces: Workspace[], id: string): Category | null {
  for (const workspace of workspaces) {
    for (const project of workspace.projects) {
      const category = project.categories.find((c) => c.id === id);
      if (category) return category;
    }
  }
  return null;
}

/**
 * Export a workspace to JSON format
 */
export function exportWorkspace(
  workspaces: Workspace[],
  workspaceId: string,
  options: Omit<ExportOptions, 'type'> = {}
): PostrocExport | null {
  const workspace = findWorkspace(workspaces, workspaceId);
  if (!workspace) return null;

  let data = structuredClone(workspace);
  if (!options.includeSecrets) {
    data = stripSensitiveData(data);
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    type: 'workspace',
    data,
  };
}

/**
 * Export a project to JSON format
 */
export function exportProject(
  workspaces: Workspace[],
  projectId: string,
  options: Omit<ExportOptions, 'type'> = {}
): PostrocExport | null {
  const project = findProject(workspaces, projectId);
  if (!project) return null;

  let data = structuredClone(project);
  if (!options.includeSecrets) {
    data = stripSensitiveData(data);
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    type: 'project',
    data,
  };
}

/**
 * Export a category to JSON format
 */
export function exportCategory(
  workspaces: Workspace[],
  categoryId: string,
  options: Omit<ExportOptions, 'type'> = {}
): PostrocExport | null {
  const category = findCategory(workspaces, categoryId);
  if (!category) return null;

  let data = structuredClone(category);
  if (!options.includeSecrets) {
    data = stripSensitiveData(data);
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    type: 'category',
    data,
  };
}

/**
 * Convert export data to JSON string
 */
export function exportToJSON(exportData: PostrocExport): string {
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate a filename for the export
 */
export function generateExportFilename(
  name: string,
  type: ExportType
): string {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${safeName}.postroc.json`;
}

/**
 * Download the export as a file
 */
export function downloadExport(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get export statistics for preview
 */
export function getExportStats(exportData: PostrocExport): {
  projects: number;
  categories: number;
  customs: number;
} {
  let projects = 0;
  let categories = 0;
  let customs = 0;

  if (exportData.type === 'workspace') {
    const workspace = exportData.data as Workspace;
    projects = workspace.projects.length;
    for (const project of workspace.projects) {
      categories += project.categories.length;
      customs += project.customs.length;
      for (const category of project.categories) {
        customs += category.customs.length;
      }
    }
  } else if (exportData.type === 'project') {
    const project = exportData.data as Project;
    projects = 1;
    categories = project.categories.length;
    customs = project.customs.length;
    for (const category of project.categories) {
      customs += category.customs.length;
    }
  } else if (exportData.type === 'category') {
    const category = exportData.data as Category;
    categories = 1;
    customs = category.customs.length;
  }

  return { projects, categories, customs };
}
