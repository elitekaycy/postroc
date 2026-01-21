import type { Workspace, Project, Category, Custom, Field, Header } from '@/lib/types/core';
import { EXPORT_VERSION, type PostrocExport, type ExportType } from './workspace-export';

export type ImportMode = 'replace' | 'merge' | 'import-as-new';

export interface ImportResult {
  success: boolean;
  error?: string;
  data?: {
    type: ExportType;
    workspaces?: Workspace[];
    projects?: Project[];
    categories?: Category[];
  };
  stats?: {
    workspaces: number;
    projects: number;
    categories: number;
    customs: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: PostrocExport;
}

/**
 * Check if a version string is compatible with current version
 */
function isVersionCompatible(version: string): boolean {
  const [major] = version.split('.');
  const [currentMajor] = EXPORT_VERSION.split('.');
  return major === currentMajor;
}

/**
 * Validate an import file
 */
export function validateImport(content: string): ValidationResult {
  try {
    const parsed = JSON.parse(content);

    if (!parsed.version) {
      return { valid: false, error: 'Missing version field' };
    }

    if (!isVersionCompatible(parsed.version)) {
      return {
        valid: false,
        error: `Incompatible version: ${parsed.version}. Expected ${EXPORT_VERSION}`,
      };
    }

    if (!parsed.type || !['workspace', 'project', 'category'].includes(parsed.type)) {
      return { valid: false, error: 'Invalid or missing type field' };
    }

    if (!parsed.data) {
      return { valid: false, error: 'Missing data field' };
    }

    return { valid: true, data: parsed as PostrocExport };
  } catch (e) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Create a mapping of old IDs to new IDs
 */
class IdMapper {
  private map = new Map<string, string>();

  get(oldId: string): string {
    if (!this.map.has(oldId)) {
      this.map.set(oldId, crypto.randomUUID());
    }
    return this.map.get(oldId)!;
  }
}

/**
 * Regenerate IDs for a field and its children
 */
function regenerateFieldIds(field: Field, mapper: IdMapper): Field {
  const newField: Field = {
    ...field,
    id: mapper.get(field.id),
  };

  // Update reference IDs if they point to customs being imported
  if (field.referenceId) {
    newField.referenceId = mapper.get(field.referenceId);
  }

  // Recursively handle children
  if (field.children && field.children.length > 0) {
    newField.children = field.children.map((child) =>
      regenerateFieldIds(child, mapper)
    );
  }

  return newField;
}

/**
 * Regenerate IDs for a header
 */
function regenerateHeaderIds(header: Header, mapper: IdMapper): Header {
  return {
    ...header,
    id: mapper.get(header.id),
  };
}

/**
 * Regenerate IDs for a custom
 */
function regenerateCustomIds(
  custom: Custom,
  mapper: IdMapper,
  newProjectId: string,
  newCategoryId?: string
): Custom {
  const newCustom: Custom = {
    ...custom,
    id: mapper.get(custom.id),
    projectId: newProjectId,
    categoryId: newCategoryId,
    fields: custom.fields.map((field) => regenerateFieldIds(field, mapper)),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (custom.customHeaders) {
    newCustom.customHeaders = custom.customHeaders.map((h) =>
      regenerateHeaderIds(h, mapper)
    );
  }

  return newCustom;
}

/**
 * Regenerate IDs for a category
 */
function regenerateCategoryIds(
  category: Category,
  mapper: IdMapper,
  newProjectId: string
): Category {
  const newCategoryId = mapper.get(category.id);

  const newCategory: Category = {
    ...category,
    id: newCategoryId,
    projectId: newProjectId,
    config: {
      ...category.config,
      id: mapper.get(category.config.id),
      projectId: newProjectId,
      defaultHeaders: category.config.defaultHeaders.map((h) =>
        regenerateHeaderIds(h, mapper)
      ),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    customs: category.customs.map((custom) =>
      regenerateCustomIds(custom, mapper, newProjectId, newCategoryId)
    ),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return newCategory;
}

/**
 * Regenerate IDs for a project
 */
function regenerateProjectIds(
  project: Project,
  mapper: IdMapper,
  newWorkspaceId: string
): Project {
  const newProjectId = mapper.get(project.id);

  const newProject: Project = {
    ...project,
    id: newProjectId,
    workspaceId: newWorkspaceId,
    customs: project.customs.map((custom) =>
      regenerateCustomIds(custom, mapper, newProjectId, undefined)
    ),
    categories: project.categories.map((category) =>
      regenerateCategoryIds(category, mapper, newProjectId)
    ),
    createdAt: Date.now(),
  };

  return newProject;
}

/**
 * Regenerate IDs for a workspace
 */
function regenerateWorkspaceIds(workspace: Workspace, mapper: IdMapper): Workspace {
  const newWorkspaceId = mapper.get(workspace.id);

  const newWorkspace: Workspace = {
    ...workspace,
    id: newWorkspaceId,
    projects: workspace.projects.map((project) =>
      regenerateProjectIds(project, mapper, newWorkspaceId)
    ),
    createdAt: Date.now(),
  };

  return newWorkspace;
}

/**
 * Import data from a validated export
 */
export function importFromExport(
  exportData: PostrocExport,
  targetWorkspaceId?: string,
  targetProjectId?: string
): ImportResult {
  const mapper = new IdMapper();

  try {
    if (exportData.type === 'workspace') {
      const workspace = exportData.data as Workspace;
      const newWorkspace = regenerateWorkspaceIds(workspace, mapper);

      return {
        success: true,
        data: {
          type: 'workspace',
          workspaces: [newWorkspace],
        },
        stats: getImportStats(exportData),
      };
    }

    if (exportData.type === 'project') {
      const project = exportData.data as Project;
      const workspaceId = targetWorkspaceId || crypto.randomUUID();
      const newProject = regenerateProjectIds(project, mapper, workspaceId);

      return {
        success: true,
        data: {
          type: 'project',
          projects: [newProject],
        },
        stats: getImportStats(exportData),
      };
    }

    if (exportData.type === 'category') {
      const category = exportData.data as Category;
      const projectId = targetProjectId || crypto.randomUUID();
      const newCategory = regenerateCategoryIds(category, mapper, projectId);

      return {
        success: true,
        data: {
          type: 'category',
          categories: [newCategory],
        },
        stats: getImportStats(exportData),
      };
    }

    return { success: false, error: 'Unknown export type' };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Import failed',
    };
  }
}

/**
 * Get import statistics for preview
 */
export function getImportStats(exportData: PostrocExport): {
  workspaces: number;
  projects: number;
  categories: number;
  customs: number;
} {
  let workspaces = 0;
  let projects = 0;
  let categories = 0;
  let customs = 0;

  if (exportData.type === 'workspace') {
    const workspace = exportData.data as Workspace;
    workspaces = 1;
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

  return { workspaces, projects, categories, customs };
}

/**
 * Read a file and return its contents
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
