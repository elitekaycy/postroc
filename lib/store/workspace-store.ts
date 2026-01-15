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
} from '@/lib/types/core';

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  activeCategoryId: string | null;
  activeCustomId: string | null;

  createWorkspace: (name: string) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;

  createProject: (workspaceId: string, name: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  createCategory: (projectId: string, name: string) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  updateCategoryConfig: (categoryId: string, config: Partial<CategoryConfig>) => void;
  setActiveEnvironment: (categoryId: string, env: Environment) => void;
  addEnvironment: (categoryId: string, env: EnvironmentConfig) => void;
  updateEnvironment: (categoryId: string, envName: Environment, updates: Partial<EnvironmentConfig>) => void;
  deleteEnvironment: (categoryId: string, envName: Environment) => void;
  updateAuth: (categoryId: string, auth: Partial<AuthConfig>) => void;
  addHeader: (categoryId: string, header: Omit<Header, 'id'>) => void;
  updateHeader: (categoryId: string, headerId: string, updates: Partial<Header>) => void;
  deleteHeader: (categoryId: string, headerId: string) => void;

  createCustom: (categoryId: string, name: string) => void;
  updateCustom: (customId: string, updates: Partial<Custom>) => void;
  deleteCustom: (customId: string) => void;

  setActiveWorkspace: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  setActiveCategory: (id: string | null) => void;
  setActiveCustom: (id: string | null) => void;

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

export const useWorkspaceStore = create<WorkspaceStore>()(
  immer((set, get) => ({
    workspaces: [],
    activeWorkspaceId: null,
    activeProjectId: null,
    activeCategoryId: null,
    activeCustomId: null,

    createWorkspace: (name: string) =>
      set((state) => {
        const workspace: Workspace = {
          id: crypto.randomUUID(),
          name,
          projects: [],
          createdAt: Date.now(),
        };
        state.workspaces.push(workspace);
        state.activeWorkspaceId = workspace.id;
      }),

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

    createProject: (workspaceId: string, name: string) =>
      set((state) => {
        const workspace = state.workspaces.find((w) => w.id === workspaceId);
        if (workspace) {
          const project: Project = {
            id: crypto.randomUUID(),
            name,
            workspaceId,
            categories: [],
            createdAt: Date.now(),
          };
          workspace.projects.push(project);
          state.activeProjectId = project.id;
        }
      }),

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

    createCategory: (projectId: string, name: string) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          const project = workspace.projects.find((p) => p.id === projectId);
          if (project) {
            const category: Category = {
              id: crypto.randomUUID(),
              name,
              projectId,
              config: createDefaultCategoryConfig(projectId, name),
              customs: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            project.categories.push(category);
            state.activeCategoryId = category.id;
            return;
          }
        }
      }),

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

    createCustom: (categoryId: string, name: string) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
            const category = project.categories.find((c) => c.id === categoryId);
            if (category) {
              const custom: Custom = {
                id: crypto.randomUUID(),
                name,
                categoryId,
                fields: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              category.customs.push(custom);
              state.activeCustomId = custom.id;
              return;
            }
          }
        }
      }),

    updateCustom: (customId: string, updates: Partial<Custom>) =>
      set((state) => {
        for (const workspace of state.workspaces) {
          for (const project of workspace.projects) {
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
            for (const category of project.categories) {
              category.customs = category.customs.filter((c) => c.id !== customId);
            }
          }
        }
        if (state.activeCustomId === customId) {
          state.activeCustomId = null;
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
        if (!id) {
          state.activeCustomId = null;
        }
      }),

    setActiveCustom: (id: string | null) =>
      set((state) => {
        state.activeCustomId = id;
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
