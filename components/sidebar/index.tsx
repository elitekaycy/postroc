'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { EditableText } from './editable-text';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Layers,
  FileCode2,
  Plus,
  Trash2,
  GripVertical,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useState, useCallback } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const {
    workspaces,
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    activeCustomId,
    editingId,
    setActiveProject,
    setActiveCategory,
    setActiveCustom,
    setEditingId,
    createWorkspace,
    createProject,
    createCategory,
    createCustom,
    updateWorkspace,
    updateProject,
    updateCategory,
    updateCustom,
    deleteProject,
    deleteCategory,
    deleteCustom,
    reorderProjects,
    reorderCategories,
    reorderCustoms,
    moveCategory,
    moveCustom,
  } = useWorkspaceStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ type: string; id: string; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { type: string; name: string };
    setDraggedItem({ type: data.type, id: String(active.id), name: data.name });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current as { type: string; parentId: string };
    const overData = over.data.current as { type: string; parentId: string };

    if (activeData.type === 'project' && overData.type === 'project') {
      const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
      if (workspace) {
        const oldIndex = workspace.projects.findIndex((p) => p.id === active.id);
        const newIndex = workspace.projects.findIndex((p) => p.id === over.id);
        const newOrder = [...workspace.projects.map((p) => p.id)];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, String(active.id));
        reorderProjects(activeWorkspaceId!, newOrder);
      }
    } else if (activeData.type === 'category' && overData.type === 'category') {
      if (activeData.parentId === overData.parentId) {
        const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
        const project = workspace?.projects.find((p) => p.id === activeData.parentId);
        if (project) {
          const oldIndex = project.categories.findIndex((c) => c.id === active.id);
          const newIndex = project.categories.findIndex((c) => c.id === over.id);
          const newOrder = [...project.categories.map((c) => c.id)];
          newOrder.splice(oldIndex, 1);
          newOrder.splice(newIndex, 0, String(active.id));
          reorderCategories(activeData.parentId, newOrder);
        }
      } else {
        moveCategory(String(active.id), overData.parentId);
      }
    } else if (activeData.type === 'custom' && overData.type === 'custom') {
      if (activeData.parentId === overData.parentId) {
        const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
        for (const project of workspace?.projects || []) {
          const category = project.categories.find((c) => c.id === activeData.parentId);
          if (category) {
            const oldIndex = category.customs.findIndex((c) => c.id === active.id);
            const newIndex = category.customs.findIndex((c) => c.id === over.id);
            const newOrder = [...category.customs.map((c) => c.id)];
            newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, String(active.id));
            reorderCustoms(activeData.parentId, newOrder);
            break;
          }
        }
      } else {
        moveCustom(String(active.id), overData.parentId);
      }
    } else if (activeData.type === 'custom' && overData.type === 'category') {
      moveCustom(String(active.id), String(over.id));
    }
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[var(--hover)] rounded mb-4"
          title="Expand sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">PostRoc</span>
          <button onClick={onToggleCollapse} className="p-1 hover:bg-[var(--hover)] rounded">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 mb-4">No workspaces yet</p>
          <button
            onClick={() => createWorkspace()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Create Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
        <div onDoubleClick={() => setEditingId(activeWorkspaceId)}>
          <EditableText
            value={activeWorkspace?.name || 'Workspace'}
            isEditing={editingId === activeWorkspaceId}
            onSave={(name) => {
              if (activeWorkspaceId) updateWorkspace(activeWorkspaceId, { name });
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            className="font-semibold text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => activeWorkspaceId && createProject(activeWorkspaceId)}
            className="p-1 hover:bg-[var(--hover)] rounded"
            title="Add Project"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={onToggleCollapse} className="p-1 hover:bg-[var(--hover)] rounded">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-auto p-2">
          <SortableContext
            items={activeWorkspace?.projects.map((p) => p.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {activeWorkspace?.projects.map((project) => (
              <SortableProject
                key={project.id}
                project={project}
                isExpanded={expandedProjects.has(project.id)}
                isActive={activeProjectId === project.id}
                editingId={editingId}
                activeCategoryId={activeCategoryId}
                activeCustomId={activeCustomId}
                expandedCategories={expandedCategories}
                onToggle={() => toggleProject(project.id)}
                onSelect={() => {
                  toggleProject(project.id);
                  setActiveProject(project.id);
                }}
                onStartEdit={(id) => setEditingId(id)}
                onUpdateName={(name) => {
                  updateProject(project.id, { name });
                  setEditingId(null);
                }}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => deleteProject(project.id)}
                onAddCategory={() => createCategory(project.id)}
                onToggleCategory={toggleCategory}
                onSelectCategory={(id) => {
                  toggleCategory(id);
                  setActiveCategory(id);
                }}
                onUpdateCategory={(id, name) => {
                  updateCategory(id, { name });
                  setEditingId(null);
                }}
                onDeleteCategory={deleteCategory}
                onAddCustom={createCustom}
                onSelectCustom={setActiveCustom}
                onUpdateCustom={(id, name) => {
                  updateCustom(id, { name });
                  setEditingId(null);
                }}
                onDeleteCustom={deleteCustom}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {draggedItem && (
            <div className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded shadow-lg text-sm">
              {draggedItem.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface SortableProjectProps {
  project: { id: string; name: string; categories: Array<{ id: string; name: string; customs: Array<{ id: string; name: string }> }> };
  isExpanded: boolean;
  isActive: boolean;
  editingId: string | null;
  activeCategoryId: string | null;
  activeCustomId: string | null;
  expandedCategories: Set<string>;
  onToggle: () => void;
  onSelect: () => void;
  onStartEdit: (id: string) => void;
  onUpdateName: (name: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onAddCategory: () => void;
  onToggleCategory: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddCustom: (categoryId: string) => void;
  onSelectCustom: (id: string) => void;
  onUpdateCustom: (id: string, name: string) => void;
  onDeleteCustom: (id: string) => void;
}

function SortableProject({
  project,
  isExpanded,
  isActive,
  editingId,
  activeCategoryId,
  activeCustomId,
  expandedCategories,
  onToggle,
  onSelect,
  onStartEdit,
  onUpdateName,
  onCancelEdit,
  onDelete,
  onAddCategory,
  onToggleCategory,
  onSelectCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddCustom,
  onSelectCustom,
  onUpdateCustom,
  onDeleteCustom,
}: SortableProjectProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: 'project', parentId: null, name: project.name },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-1">
      <div
        className={`group flex items-center rounded hover:bg-[var(--hover)] ${
          isActive ? 'bg-[var(--hover)]' : ''
        }`}
      >
        <button {...attributes} {...listeners} className="p-1 cursor-grab opacity-0 group-hover:opacity-100">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </button>
        <button onClick={onSelect} className="p-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <FolderKanban className="w-4 h-4 text-amber-500 mr-2" />
        <div className="flex-1" onDoubleClick={() => onStartEdit(project.id)}>
          <EditableText
            value={project.name}
            isEditing={editingId === project.id}
            onSave={onUpdateName}
            onCancel={onCancelEdit}
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100">
          <button onClick={onAddCategory} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Add Category">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-4">
          <SortableContext
            items={project.categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {project.categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                projectId={project.id}
                isExpanded={expandedCategories.has(category.id)}
                isActive={activeCategoryId === category.id}
                editingId={editingId}
                activeCustomId={activeCustomId}
                onToggle={() => onToggleCategory(category.id)}
                onSelect={() => onSelectCategory(category.id)}
                onStartEdit={onStartEdit}
                onUpdateName={(name) => onUpdateCategory(category.id, name)}
                onCancelEdit={onCancelEdit}
                onDelete={() => onDeleteCategory(category.id)}
                onAddCustom={() => onAddCustom(category.id)}
                onSelectCustom={onSelectCustom}
                onUpdateCustom={onUpdateCustom}
                onDeleteCustom={onDeleteCustom}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

interface SortableCategoryProps {
  category: { id: string; name: string; customs: Array<{ id: string; name: string }> };
  projectId: string;
  isExpanded: boolean;
  isActive: boolean;
  editingId: string | null;
  activeCustomId: string | null;
  onToggle: () => void;
  onSelect: () => void;
  onStartEdit: (id: string) => void;
  onUpdateName: (name: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onAddCustom: () => void;
  onSelectCustom: (id: string) => void;
  onUpdateCustom: (id: string, name: string) => void;
  onDeleteCustom: (id: string) => void;
}

function SortableCategory({
  category,
  projectId,
  isExpanded,
  isActive,
  editingId,
  activeCustomId,
  onToggle,
  onSelect,
  onStartEdit,
  onUpdateName,
  onCancelEdit,
  onDelete,
  onAddCustom,
  onSelectCustom,
  onUpdateCustom,
  onDeleteCustom,
}: SortableCategoryProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    data: { type: 'category', parentId: projectId, name: category.name },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-0.5">
      <div
        className={`group flex items-center rounded hover:bg-[var(--hover)] ${
          isActive ? 'bg-[var(--hover)]' : ''
        }`}
      >
        <button {...attributes} {...listeners} className="p-1 cursor-grab opacity-0 group-hover:opacity-100">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </button>
        <button onClick={onSelect} className="p-1">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
        <Layers className="w-3.5 h-3.5 text-blue-500 mr-2" />
        <div className="flex-1" onDoubleClick={() => onStartEdit(category.id)}>
          <EditableText
            value={category.name}
            isEditing={editingId === category.id}
            onSave={onUpdateName}
            onCancel={onCancelEdit}
            className="text-sm"
          />
        </div>
        <span className="text-xs text-gray-500 mr-1">{category.customs.length}</span>
        <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100">
          <button onClick={onAddCustom} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Add Custom">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-4">
          <SortableContext
            items={category.customs.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {category.customs.map((custom) => (
              <SortableCustom
                key={custom.id}
                custom={custom}
                categoryId={category.id}
                isActive={activeCustomId === custom.id}
                editingId={editingId}
                onSelect={() => onSelectCustom(custom.id)}
                onStartEdit={onStartEdit}
                onUpdateName={(name) => onUpdateCustom(custom.id, name)}
                onCancelEdit={onCancelEdit}
                onDelete={() => onDeleteCustom(custom.id)}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

interface SortableCustomProps {
  custom: { id: string; name: string };
  categoryId: string;
  isActive: boolean;
  editingId: string | null;
  onSelect: () => void;
  onStartEdit: (id: string) => void;
  onUpdateName: (name: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function SortableCustom({
  custom,
  categoryId,
  isActive,
  editingId,
  onSelect,
  onStartEdit,
  onUpdateName,
  onCancelEdit,
  onDelete,
}: SortableCustomProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: custom.id,
    data: { type: 'custom', parentId: categoryId, name: custom.name },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center rounded hover:bg-[var(--hover)] ${
          isActive ? 'bg-[var(--hover)] font-medium' : ''
        }`}
      >
        <button {...attributes} {...listeners} className="p-1 cursor-grab opacity-0 group-hover:opacity-100">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </button>
        <button onClick={onSelect} className="flex-1 flex items-center gap-2 py-1.5 text-sm text-left">
          <FileCode2 className="w-3.5 h-3.5 text-green-500" />
          <div className="flex-1" onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(custom.id); }}>
            <EditableText
              value={custom.name}
              isEditing={editingId === custom.id}
              onSave={onUpdateName}
              onCancel={onCancelEdit}
            />
          </div>
        </button>
        <button
          onClick={onDelete}
          className="p-1 pr-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
