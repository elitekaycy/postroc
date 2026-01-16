'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { EntityModal, DeleteConfirmModal } from '@/components/modals/entity-modals';
import { ChevronDown, ChevronRight, FolderIcon, LayoutGrid, FileText, Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

type EntityType = 'workspace' | 'project' | 'category' | 'custom';

interface ContextMenuState {
  isOpen: boolean;
  type: EntityType;
  id: string;
  name: string;
  parentId?: string;
  x: number;
  y: number;
}

export function Sidebar() {
  const {
    workspaces,
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    activeCustomId,
    setActiveProject,
    setActiveCategory,
    setActiveCustom,
    deleteWorkspace,
    deleteProject,
    deleteCategory,
    deleteCustom,
  } = useWorkspaceStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: EntityType;
    parentId?: string;
    editId?: string;
  }>({ isOpen: false, type: 'workspace' });

  const [deleteState, setDeleteState] = useState<{
    isOpen: boolean;
    type: EntityType;
    id: string;
    name: string;
  }>({ isOpen: false, type: 'workspace', id: '', name: '' });

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const openModal = (type: EntityType, parentId?: string, editId?: string) => {
    setModalState({ isOpen: true, type, parentId, editId });
    setContextMenu(null);
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: 'workspace' });
  };

  const openDeleteConfirm = (type: EntityType, id: string, name: string) => {
    setDeleteState({ isOpen: true, type, id, name });
    setContextMenu(null);
  };

  const handleDelete = () => {
    switch (deleteState.type) {
      case 'workspace':
        deleteWorkspace(deleteState.id);
        break;
      case 'project':
        deleteProject(deleteState.id);
        break;
      case 'category':
        deleteCategory(deleteState.id);
        break;
      case 'custom':
        deleteCustom(deleteState.id);
        break;
    }
  };

  const showContextMenu = (
    e: React.MouseEvent,
    type: EntityType,
    id: string,
    name: string,
    parentId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      type,
      id,
      name,
      parentId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  if (workspaces.length === 0) {
    return (
      <div className="w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] p-4 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 mb-4">No workspaces yet</p>
        <button
          onClick={() => openModal('workspace')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Create Workspace
        </button>

        <EntityModal
          type={modalState.type}
          isOpen={modalState.isOpen}
          onClose={closeModal}
          parentId={modalState.parentId}
          editId={modalState.editId}
        />
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {activeWorkspace?.name || 'Workspace'}
        </h2>
        <button
          onClick={() => openModal('project', activeWorkspaceId ?? undefined)}
          className="p-1 hover:bg-[var(--hover)] rounded"
          title="Add Project"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {activeWorkspace?.projects.map((project) => (
          <div key={project.id} className="mb-2">
            <div
              className={`group flex items-center rounded hover:bg-[var(--hover)] ${
                activeProjectId === project.id ? 'bg-[var(--hover)]' : ''
              }`}
            >
              <button
                onClick={() => {
                  toggleProject(project.id);
                  setActiveProject(project.id);
                }}
                className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm"
              >
                {expandedProjects.has(project.id) ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
                <FolderIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{project.name}</span>
              </button>
              <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => openModal('category', project.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title="Add Category"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => showContextMenu(e, 'project', project.id, project.name, activeWorkspaceId ?? undefined)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {expandedProjects.has(project.id) && (
              <div className="ml-6 mt-1 space-y-1">
                {project.categories.map((category) => (
                  <div key={category.id}>
                    <div
                      className={`group flex items-center rounded hover:bg-[var(--hover)] ${
                        activeCategoryId === category.id ? 'bg-[var(--hover)] font-medium' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          toggleCategory(category.id);
                          setActiveCategory(category.id);
                        }}
                        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{category.name}</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {category.customs.length}
                        </span>
                      </button>
                      <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => openModal('custom', category.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Add Custom"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => showContextMenu(e, 'category', category.id, category.name, project.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {expandedCategories.has(category.id) && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {category.customs.map((custom) => (
                          <div
                            key={custom.id}
                            className={`group flex items-center rounded hover:bg-[var(--hover)] ${
                              activeCustomId === custom.id ? 'bg-[var(--hover)] font-medium' : ''
                            }`}
                          >
                            <button
                              onClick={() => setActiveCustom(custom.id)}
                              className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm"
                            >
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{custom.name}</span>
                            </button>
                            <button
                              onClick={(e) => showContextMenu(e, 'custom', custom.id, custom.name, category.id)}
                              className="p-1 pr-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg py-1 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => openModal(contextMenu.type, contextMenu.parentId, contextMenu.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--hover)]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => openDeleteConfirm(contextMenu.type, contextMenu.id, contextMenu.name)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-[var(--hover)]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      <EntityModal
        type={modalState.type}
        isOpen={modalState.isOpen}
        onClose={closeModal}
        parentId={modalState.parentId}
        editId={modalState.editId}
      />

      <DeleteConfirmModal
        isOpen={deleteState.isOpen}
        onClose={() => setDeleteState({ ...deleteState, isOpen: false })}
        onConfirm={handleDelete}
        entityType={deleteState.type}
        entityName={deleteState.name}
      />
    </div>
  );
}
