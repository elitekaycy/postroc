import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Workspace,
  Project,
  Category,
  Custom,
  CategoryConfig,
  Environment,
  EnvironmentConfig,
  AuthConfig,
  Header,
  Field,
} from '@/lib/types/core';
import {
  populateFieldsFromObject,
  extractFieldsFromResponse,
} from '@/lib/engine/field-populator';

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  activeCategoryId: string | null;
  activeCustomId: string | null;
  editingId: string | null;

  createWorkspace: (name?: string) => string;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;

  createProject: (workspaceId: string, name?: string) => string | null;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (workspaceId: string, projectIds: string[]) => void;

  createCategory: (projectId: string, name?: string) => string | null;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategories: (projectId: string, categoryIds: string[]) => void;
  moveCategory: (categoryId: string, targetProjectId: string) => void;
  updateCategoryConfig: (categoryId: string, config: Partial<CategoryConfig>) => void;
  setActiveEnvironment: (categoryId: string, env: Environment) => void;
  addEnvironment: (categoryId: string, env: EnvironmentConfig) => void;
  updateEnvironment: (categoryId: string, envName: Environment, updates: Partial<EnvironmentConfig>) => void;
  deleteEnvironment: (categoryId: string, envName: Environment) => void;
  updateAuth: (categoryId: string, auth: Partial<AuthConfig>) => void;
  addHeader: (categoryId: string, header: Omit<Header, 'id'>) => void;
  updateHeader: (categoryId: string, headerId: string, updates: Partial<Header>) => void;
  deleteHeader: (categoryId: string, headerId: string) => void;

  createCustom: (projectId: string, categoryId?: string, name?: string) => string | null;
  updateCustom: (customId: string, updates: Partial<Custom>) => void;
  deleteCustom: (customId: string) => void;
  reorderCustoms: (parentId: string, customIds: string[], isCategory?: boolean) => void;
  moveCustom: (customId: string, targetProjectId: string, targetCategoryId?: string) => void;

  addField: (customId: string, field: Omit<Field, 'id'>) => void;
  updateField: (customId: string, fieldId: string, updates: Partial<Field>) => void;
  deleteField: (customId: string, fieldId: string) => void;
  reorderFields: (customId: string, fieldIds: string[]) => void;
  addNestedField: (customId: string, parentFieldId: string, field: Omit<Field, 'id'>) => void;
  updateNestedField: (customId: string, fieldPath: string[], updates: Partial<Field>) => void;
  deleteNestedField: (customId: string, fieldPath: string[]) => void;
  populateFieldsFromResponse: (customId: string, data: Record<string, unknown>) => void;

  setActiveWorkspace: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  setActiveCategory: (id: string | null) => void;
  setActiveCustom: (id: string | null) => void;
  setEditingId: (id: string | null) => void;

  getActiveCategory: () => Category | null;
  getActiveCustom: () => Custom | null;
}

const createDefaultCategoryConfig = (projectId: string, name: string): CategoryConfig => ({
  id: crypto.randomUUID(),
  name,
  projectId,
  environments: [
    { name: 'local', baseUrl: 'http://localhost:3000' },
    { name: 'staging', baseUrl: '' },
    { name: 'production', baseUrl: '' },
  ],
  activeEnvironment: 'local',
  auth: { type: 'none' },
  defaultHeaders: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

let lastCreatedId: string | null = null;

export const useWorkspaceStore = create<WorkspaceStore>()(
  immer((set, get) => ({
    workspaces: [],
    activeWorkspaceId: null,
    activeProjectId: null,
    activeCategoryId: null,
    activeCustomId: null,
    editingId: null,

    createWorkspace: (name?: string) => {
      const id = crypto.randomUUID();
      const workspaceName = name || `Workspace ${get().workspaces.length + 1}`;
      set((state) => {
        const workspace: Workspace = {
          id,
          name: workspaceName,
          projects: [],
          createdAt: Date.now(),
        };
        state.workspaces.push(workspace);
        state.activeWorkspaceId = id;
        state.editingId = id;
      });
      return id;
    },

    updateWorkspace: (id: string, updates: Partial<Workspace>) =>
      set((state) => {
        const workspace = state.workspaces.find((w) => w.id === id);
        if (workspace) {
          Object.assign(workspace, updates);
        }
      }),

    deleteWorkspace: (id: string) =>
      set((state) => {
        state.workspaces = state.workspaces.filter((w) => w.id !== id);
        if (state.activeWorkspaceId === id) {
          state.activeWorkspaceId = null;
          state.activeProjectId = null;
          state.activeCategoryId = null;
          state.activeCustomId = null;
        }
      }),

    createProject: (workspaceId: string, name?: string) => {
      const workspace = get().workspaces.find((w) => w.id === workspaceId);
      if (!workspace) return null;

      const id = crypto.randomUUID();
      const projectName = name || `Project ${workspace.projects.length + 1}`;
      set((state) => {
        const ws = state.workspaces.find((w) => w.id === workspaceId);
        if (ws) {
          const project: Project = {
            id,
            name: projectName,
            workspaceId,
            categories: [],
            customs: [],
            createdAt: Date.now(),
          };
          ws.projects.push(project);
          state.activeProjectId = id;
          state.editingId = id;
        }
      });
      return id;
    },

    updateProject: (id: string, updates: Partial<Project>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          const project = workspace.projects.find((p) => p.id === id);
          if (project) {
            Object.assign(project, updates);
            return;
          }
        }
      }),

    deleteProject: (id: string) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          workspace.projects = workspace.projects.filter((p) => p.id !== id);
        }
        if (state.activeProjectId === id) {
          state.activeProjectId = null;
          state.activeCategoryId = null;
          state.activeCustomId = null;
        }
      }),

    reorderProjects: (workspaceId: string, projectIds: string[]) =>
      set((state) => {
        const workspace = state.workspaces.find((w) => w.id === workspaceId);
        if (workspace) {
          const projectMap = new Map(workspace.projects.map((p) => [p.id, p]));
          const reordered: Project[] = [];
          for (const id of projectIds) {
            const project = projectMap.get(id);
            if (project) reordered.push(project);
          }
          workspace.projects = reordered;
        }
      }),

    createCategory: (projectId: string, name?: string) => {
      let project: Project | undefined;
      for (const workspace of get().workspaces) {
        project = workspace.projects.find((p) => p.id === projectId);
        if (project) break;
      }
      if (!project) return null;

      const id = crypto.randomUUID();
      const categoryName = name || `Category ${project.categories.length + 1}`;
      set((state) => {
        for (const workspace of state.workspaces) {
          const proj = workspace.projects.find((p) => p.id === projectId);
          if (proj) {
            const category: Category = {
              id,
              name: categoryName,
              projectId,
              config: createDefaultCategoryConfig(projectId, categoryName),
              customs: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            proj.categories.push(category);
            state.activeCategoryId = id;
            state.editingId = id;
            return;
          }
        }
      });
      return id;
    },

    updateCategory: (categoryId: string, updates: Partial<Category>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              Object.assign(category, updates);
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    deleteCategory: (categoryId: string) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            project.categories = project.categories.filter((c) => c.id !== categoryId);
          }
        }
        if (state.activeCategoryId === categoryId) {
          state.activeCategoryId = null;
          state.activeCustomId = null;
        }
      }),

    reorderCategories: (projectId: string, categoryIds: string[]) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          const project = workspace.projects.find((p) => p.id === projectId);
          if (project) {
            const categoryMap = new Map(project.categories.map((c) => [c.id, c]));
            const reordered: Category[] = [];
            for (const id of categoryIds) {
              const category = categoryMap.get(id);
              if (category) reordered.push(category);
            }
            project.categories = reordered;
            return;
          }
        }
      }),

    moveCategory: (categoryId: string, targetProjectId: string) =>
      set((state) => {
        let category: Category | undefined;
        let sourceProject: Project | undefined;

        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const found = project.categories.find((c) => c.id === categoryId);
            if (found) {
              category = found;
              sourceProject = project;
              break;
            }
          }
          if (category) break;
        }

        if (!category || !sourceProject) return;

        sourceProject.categories = sourceProject.categories.filter((c) => c.id !== categoryId);

        for (const workspace of state.workspaces) {
          const targetProject = workspace.projects.find((p) => p.id === targetProjectId);
          if (targetProject) {
            category.projectId = targetProjectId;
            targetProject.categories.push(category);
            return;
          }
        }
      }),

    updateCategoryConfig: (categoryId: string, config: Partial<CategoryConfig>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              Object.assign(category.config, config);
              category.config.updatedAt = Date.now();
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    setActiveEnvironment: (categoryId: string, env: Environment) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              category.config.activeEnvironment = env;
              category.config.updatedAt = Date.now();
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    addEnvironment: (categoryId: string, env: EnvironmentConfig) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              category.config.environments.push(env);
              category.config.updatedAt = Date.now();
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    updateEnvironment: (categoryId: string, envName: Environment, updates: Partial<EnvironmentConfig>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              const env = category.config.environments.find((e) => e.name === envName);
              if (env) {
                Object.assign(env, updates);
                category.config.updatedAt = Date.now();
                category.updatedAt = Date.now();
              }
              return;
            }
          }
        }
      }),

    deleteEnvironment: (categoryId: string, envName: Environment) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              category.config.environments = category.config.environments.filter((e) => e.name !== envName);
              category.config.updatedAt = Date.now();
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    updateAuth: (categoryId: string, auth: Partial<AuthConfig>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              Object.assign(category.config.auth, auth);
              category.config.updatedAt = Date.now();
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    addHeader: (categoryId: string, header: Omit<Header, 'id'>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              category.config.defaultHeaders.push({
                ...header,
                id: crypto.randomUUID(),
              });
              category.config.updatedAt = Date.now();
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    updateHeader: (categoryId: string, headerId: string, updates: Partial<Header>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              const header = category.config.defaultHeaders.find((h) => h.id === headerId);
              if (header) {
                Object.assign(header, updates);
                category.config.updatedAt = Date.now();
                category.updatedAt = Date.now();
              }
              return;
            }
          }
        }
      }),

    deleteHeader: (categoryId: string, headerId: string) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              category.config.defaultHeaders = category.config.defaultHeaders.filter((h) => h.id !== headerId);
              category.config.updatedAt = Date.now();
              category.updatedAt = Date.now();
              return;
            }
          }
        }
      }),

    createCustom: (projectId: string, categoryId?: string, name?: string) => {
      let project: Project | undefined;
      let category: Category | undefined;

      for (const workspace of get().workspaces) {
        project = workspace.projects.find((p) => p.id === projectId);
        if (project) {
          if (categoryId) {
            category = project.categories.find((c) => c.id === categoryId);
          }
          break;
        }
      }
      if (!project) return null;

      const existingCount = categoryId && category
        ? category.customs.length
        : project.customs.length;
      const id = crypto.randomUUID();
      const customName = name || `Custom ${existingCount + 1}`;

      set((state) => {
        for (const workspace of state.workspaces) {
          const proj = workspace.projects.find((p) => p.id === projectId);
          if (proj) {
            const custom: Custom = {
              id,
              name: customName,
              projectId,
              categoryId,
              fields: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            if (categoryId) {
              const cat = proj.categories.find((c) => c.id === categoryId);
              if (cat) {
                cat.customs.push(custom);
              }
            } else {
              proj.customs.push(custom);
            }
            state.activeCustomId = id;
            state.editingId = id;
            return;
          }
        }
      });
      return id;
    },

    updateCustom: (customId: string, updates: Partial<Custom>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Check project-level customs
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              Object.assign(projectCustom, updates);
              projectCustom.updatedAt = Date.now();
              return;
            }
            // Check category-level customs
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                Object.assign(custom, updates);
                custom.updatedAt = Date.now();
                return;
              }
            }
          }
        }
      }),

    deleteCustom: (customId: string) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Delete from project-level customs
            project.customs = project.customs.filter((c) => c.id !== customId);
            // Delete from category-level customs
            for (const category of project.categories) {
              category.customs = category.customs.filter((c) => c.id !== customId);
            }
          }
        }
        if (state.activeCustomId === customId) {
          state.activeCustomId = null;
        }
      }),

    reorderCustoms: (parentId: string, customIds: string[], isCategory = false) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            if (isCategory) {
              const category = project.categories.find((c) => c.id === parentId);
              if (category) {
                const customMap = new Map(category.customs.map((c) => [c.id, c]));
                const reordered: Custom[] = [];
                for (const id of customIds) {
                  const custom = customMap.get(id);
                  if (custom) reordered.push(custom);
                }
                category.customs = reordered;
                return;
              }
            } else if (project.id === parentId) {
              const customMap = new Map(project.customs.map((c) => [c.id, c]));
              const reordered: Custom[] = [];
              for (const id of customIds) {
                const custom = customMap.get(id);
                if (custom) reordered.push(custom);
              }
              project.customs = reordered;
              return;
            }
          }
        }
      }),

    moveCustom: (customId: string, targetProjectId: string, targetCategoryId?: string) =>
      set((state) => {
        let custom: Custom | undefined;
        let sourceProject: Project | undefined;
        let sourceCategory: Category | undefined;

        // Find the custom
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Check project-level customs
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              custom = projectCustom;
              sourceProject = project;
              break;
            }
            // Check category-level customs
            for (const category of project.categories) {
              const found = category.customs.find((c) => c.id === customId);
              if (found) {
                custom = found;
                sourceProject = project;
                sourceCategory = category;
                break;
              }
            }
            if (custom) break;
          }
          if (custom) break;
        }

        if (!custom || !sourceProject) return;

        // Remove from source
        if (sourceCategory) {
          sourceCategory.customs = sourceCategory.customs.filter((c) => c.id !== customId);
        } else {
          sourceProject.customs = sourceProject.customs.filter((c) => c.id !== customId);
        }

        // Add to target
        for (const workspace of state.workspaces) {
          const targetProject = workspace.projects.find((p) => p.id === targetProjectId);
          if (targetProject) {
            custom.projectId = targetProjectId;
            custom.categoryId = targetCategoryId;

            if (targetCategoryId) {
              const targetCategory = targetProject.categories.find((c) => c.id === targetCategoryId);
              if (targetCategory) {
                targetCategory.customs.push(custom);
              }
            } else {
              targetProject.customs.push(custom);
            }
            return;
          }
        }
      }),

    addField: (customId: string, field: Omit<Field, 'id'>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Check project-level customs
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              projectCustom.fields.push({ ...field, id: crypto.randomUUID() });
              projectCustom.updatedAt = Date.now();
              return;
            }
            // Check category-level customs
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                custom.fields.push({ ...field, id: crypto.randomUUID() });
                custom.updatedAt = Date.now();
                return;
              }
            }
          }
        }
      }),

    updateField: (customId: string, fieldId: string, updates: Partial<Field>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Check project-level customs
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              const field = projectCustom.fields.find((f) => f.id === fieldId);
              if (field) {
                Object.assign(field, updates);
                projectCustom.updatedAt = Date.now();
              }
              return;
            }
            // Check category-level customs
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                const field = custom.fields.find((f) => f.id === fieldId);
                if (field) {
                  Object.assign(field, updates);
                  custom.updatedAt = Date.now();
                }
                return;
              }
            }
          }
        }
      }),

    deleteField: (customId: string, fieldId: string) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Check project-level customs
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              projectCustom.fields = projectCustom.fields.filter((f) => f.id !== fieldId);
              projectCustom.updatedAt = Date.now();
              return;
            }
            // Check category-level customs
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                custom.fields = custom.fields.filter((f) => f.id !== fieldId);
                custom.updatedAt = Date.now();
                return;
              }
            }
          }
        }
      }),

    reorderFields: (customId: string, fieldIds: string[]) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Check project-level customs
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              const fieldMap = new Map(projectCustom.fields.map((f) => [f.id, f]));
              const reordered: Field[] = [];
              for (const id of fieldIds) {
                const field = fieldMap.get(id);
                if (field) reordered.push(field);
              }
              projectCustom.fields = reordered;
              projectCustom.updatedAt = Date.now();
              return;
            }
            // Check category-level customs
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                const fieldMap = new Map(custom.fields.map((f) => [f.id, f]));
                const reordered: Field[] = [];
                for (const id of fieldIds) {
                  const field = fieldMap.get(id);
                  if (field) {
                    reordered.push(field);
                  }
                }
                custom.fields = reordered;
                custom.updatedAt = Date.now();
                return;
              }
            }
          }
        }
      }),

    addNestedField: (customId: string, parentFieldId: string, field: Omit<Field, 'id'>) =>
      set((state) => {
        const findAndAddNested = (fields: Field[]): boolean => {
          for (const f of fields) {
            if (f.id === parentFieldId) {
              if (!f.children) f.children = [];
              f.children.push({ ...field, id: crypto.randomUUID() });
              return true;
            }
            if (f.children && findAndAddNested(f.children)) {
              return true;
            }
          }
          return false;
        };

        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              if (findAndAddNested(projectCustom.fields)) {
                projectCustom.updatedAt = Date.now();
              }
              return;
            }
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                if (findAndAddNested(custom.fields)) {
                  custom.updatedAt = Date.now();
                }
                return;
              }
            }
          }
        }
      }),

    updateNestedField: (customId: string, fieldPath: string[], updates: Partial<Field>) =>
      set((state) => {
        const findAndUpdate = (fields: Field[], path: string[], depth: number): boolean => {
          if (depth >= path.length) return false;
          const targetId = path[depth];
          for (const f of fields) {
            if (f.id === targetId) {
              if (depth === path.length - 1) {
                Object.assign(f, updates);
                return true;
              }
              if (f.children) {
                return findAndUpdate(f.children, path, depth + 1);
              }
              return false;
            }
          }
          return false;
        };

        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              if (findAndUpdate(projectCustom.fields, fieldPath, 0)) {
                projectCustom.updatedAt = Date.now();
              }
              return;
            }
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                if (findAndUpdate(custom.fields, fieldPath, 0)) {
                  custom.updatedAt = Date.now();
                }
                return;
              }
            }
          }
        }
      }),

    deleteNestedField: (customId: string, fieldPath: string[]) =>
      set((state) => {
        const findAndDelete = (fields: Field[], path: string[], depth: number): boolean => {
          if (depth >= path.length) return false;
          const targetId = path[depth];

          if (depth === path.length - 1) {
            const index = fields.findIndex((f) => f.id === targetId);
            if (index !== -1) {
              fields.splice(index, 1);
              return true;
            }
            return false;
          }

          for (const f of fields) {
            if (f.children && findAndDelete(f.children, path, depth + 1)) {
              return true;
            }
          }
          return false;
        };

        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              if (findAndDelete(projectCustom.fields, fieldPath, 0)) {
                projectCustom.updatedAt = Date.now();
              }
              return;
            }
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                if (findAndDelete(custom.fields, fieldPath, 0)) {
                  custom.updatedAt = Date.now();
                }
                return;
              }
            }
          }
        }
      }),

    populateFieldsFromResponse: (customId: string, data: Record<string, unknown>) =>
      set((state) => {
        // Helper to recursively add IDs to field and its children
        const addIdsToField = (fieldDef: Omit<Field, 'id'>): Field => {
          const field: Field = {
            ...fieldDef,
            id: crypto.randomUUID(),
          };
          if (fieldDef.children && fieldDef.children.length > 0) {
            field.children = fieldDef.children.map((child) =>
              addIdsToField(child as Omit<Field, 'id'>)
            );
          }
          return field;
        };

        // Extract fields from response (handles nested data patterns)
        const extractedData = extractFieldsFromResponse(data);
        const newFieldDefs = populateFieldsFromObject(extractedData);

        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            // Check project-level customs
            const projectCustom = project.customs.find((c) => c.id === customId);
            if (projectCustom) {
              const existingKeys = new Set(projectCustom.fields.map((f) => f.key));
              // Only add fields that don't already exist
              for (const fieldDef of newFieldDefs) {
                if (!existingKeys.has(fieldDef.key)) {
                  projectCustom.fields.push(addIdsToField(fieldDef));
                }
              }
              projectCustom.updatedAt = Date.now();
              return;
            }
            // Check category-level customs
            for (const category of project.categories) {
              const custom = category.customs.find((c) => c.id === customId);
              if (custom) {
                const existingKeys = new Set(custom.fields.map((f) => f.key));
                // Only add fields that don't already exist
                for (const fieldDef of newFieldDefs) {
                  if (!existingKeys.has(fieldDef.key)) {
                    custom.fields.push(addIdsToField(fieldDef));
                  }
                }
                custom.updatedAt = Date.now();
                return;
              }
            }
          }
        }
      }),

    setActiveWorkspace: (id: string | null) =>
      set((state) => {
        state.activeWorkspaceId = id;
        if (!id) {
          state.activeProjectId = null;
          state.activeCategoryId = null;
          state.activeCustomId = null;
        }
      }),

    setActiveProject: (id: string | null) =>
      set((state) => {
        state.activeProjectId = id;
        if (!id) {
          state.activeCategoryId = null;
          state.activeCustomId = null;
        }
      }),

    setActiveCategory: (id: string | null) =>
      set((state) => {
        state.activeCategoryId = id;
        state.activeCustomId = null;
      }),

    setActiveCustom: (id: string | null) =>
      set((state) => {
        state.activeCustomId = id;
      }),

    setEditingId: (id: string | null) =>
      set((state) => {
        state.editingId = id;
      }),

    getActiveCategory: () => {
      const state = get();
      for (const workspace of state.workspaces) {
        for (const project of workspace.projects) {
          const category = project.categories.find((c) => c.id === state.activeCategoryId);
          if (category) {
            return category;
          }
        }
      }
      return null;
    },

    getActiveCustom: () => {
      const state = get();
      for (const workspace of state.workspaces) {
        for (const project of workspace.projects) {
          // Check project-level customs
          const projectCustom = project.customs.find((c) => c.id === state.activeCustomId);
          if (projectCustom) {
            return projectCustom;
          }
          // Check category-level customs
          for (const category of project.categories) {
            const custom = category.customs.find((c) => c.id === state.activeCustomId);
            if (custom) {
              return custom;
            }
          }
        }
      }
      return null;
    },
  }))
);
