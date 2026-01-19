'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { EditableText } from './editable-text';
import {
  DndContext,
  DragEndEvent,
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
  Folder,
  Box,
  FileCode,
  Plus,
  Trash2,
  GripVertical,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useState } from 'react';

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
      activationConstraint: { distance: 8 },
    })
  );

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
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

    const activeData = active.data.current as { type: string; parentId: string; projectId?: string; isCategory?: boolean };
    const overData = over.data.current as { type: string; parentId: string; projectId?: string; isCategory?: boolean };

    if (activeData.type === 'project' && overData.type === 'project') {
      const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
      if (workspace) {
        const ids = workspace.projects.map((p) => p.id);
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        ids.splice(oldIndex, 1);
        ids.splice(newIndex, 0, String(active.id));
        reorderProjects(activeWorkspaceId!, ids);
      }
    } else if (activeData.type === 'category' && overData.type === 'category') {
      if (activeData.parentId === overData.parentId) {
        const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
        const project = workspace?.projects.find((p) => p.id === activeData.parentId);
        if (project) {
          const ids = project.categories.map((c) => c.id);
          const oldIndex = ids.indexOf(String(active.id));
          const newIndex = ids.indexOf(String(over.id));
          ids.splice(oldIndex, 1);
          ids.splice(newIndex, 0, String(active.id));
          reorderCategories(activeData.parentId, ids);
        }
      } else {
        moveCategory(String(active.id), overData.parentId);
      }
    } else if (activeData.type === 'custom' && overData.type === 'custom') {
      if (activeData.parentId === overData.parentId && activeData.isCategory === overData.isCategory) {
        const ids = getCustomIds(activeData.parentId, activeData.isCategory);
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        ids.splice(oldIndex, 1);
        ids.splice(newIndex, 0, String(active.id));
        reorderCustoms(activeData.parentId, ids, activeData.isCategory);
      } else {
        moveCustom(String(active.id), overData.projectId!, overData.isCategory ? overData.parentId : undefined);
      }
    } else if (activeData.type === 'custom' && overData.type === 'category') {
      moveCustom(String(active.id), overData.parentId, String(over.id));
    } else if (activeData.type === 'custom' && overData.type === 'project') {
      moveCustom(String(active.id), String(over.id), undefined);
    }
  };

  const getCustomIds = (parentId: string, isCategory?: boolean): string[] => {
    const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!workspace) return [];
    for (const project of workspace.projects) {
      if (isCategory) {
        const category = project.categories.find((c) => c.id === parentId);
        if (category) return category.customs.map((c) => c.id);
      } else if (project.id === parentId) {
        return project.customs.map((c) => c.id);
      }
    }
    return [];
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col items-center py-3 gap-2 transition-all duration-200 overflow-auto">
        <button onClick={onToggleCollapse} className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors" title="Expand sidebar">
          <PanelLeft className="w-4 h-4 text-[var(--muted)]" />
        </button>

        {activeWorkspace && (
          <>
            <div className="w-full h-px bg-[var(--border)] my-1" />
            {activeWorkspace.projects.map((project) => (
              <div key={project.id} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => {
                    setActiveProject(project.id);
                    if (!expandedProjects.has(project.id)) toggleProject(project.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    activeProjectId === project.id ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover)]'
                  }`}
                  title={project.name}
                >
                  <Folder className={`w-4 h-4 ${activeProjectId === project.id ? 'text-[var(--active-text)]' : 'text-[var(--muted)]'}`} />
                </button>
                {expandedProjects.has(project.id) && (
                  <>
                    {project.categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          activeCategoryId === category.id ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover)]'
                        }`}
                        title={category.name}
                      >
                        <Box className={`w-3.5 h-3.5 ${activeCategoryId === category.id ? 'text-[var(--active-text)]' : 'text-[var(--muted)]'}`} />
                      </button>
                    ))}
                    {project.customs.map((custom) => (
                      <button
                        key={custom.id}
                        onClick={() => setActiveCustom(custom.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          activeCustomId === custom.id ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover)]'
                        }`}
                        title={custom.name}
                      >
                        <FileCode className={`w-3.5 h-3.5 ${activeCustomId === custom.id ? 'text-[var(--active-text)]' : 'text-[var(--muted)]'}`} />
                      </button>
                    ))}
                  </>
                )}
              </div>
            ))}
          </>
        )}
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
    <div className="w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col overflow-hidden transition-all duration-200">
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
        <div onDoubleClick={() => setEditingId(activeWorkspaceId)}>
          <EditableText
            value={activeWorkspace?.name || 'Workspace'}
            isEditing={editingId === activeWorkspaceId}
            onSave={(name) => {
              if (activeWorkspaceId) updateWorkspace(activeWorkspaceId, { name });
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            className="font-medium text-sm"
          />
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => activeWorkspaceId && createProject(activeWorkspaceId)}
            className="p-1.5 hover:bg-[var(--hover)] rounded-md transition-colors"
            title="Add Project"
          >
            <Plus className="w-4 h-4 text-[var(--muted)]" />
          </button>
          <button onClick={onToggleCollapse} className="p-1.5 hover:bg-[var(--hover)] rounded-md transition-colors" title="Collapse sidebar">
            <PanelLeftClose className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-auto py-2 px-2 space-y-3">
          <SortableContext
            items={activeWorkspace?.projects.map((p) => p.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {activeWorkspace?.projects.map((project) => (
              <ProjectItem
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
                  if (!expandedProjects.has(project.id)) toggleProject(project.id);
                  setActiveProject(project.id);
                }}
                onStartEdit={setEditingId}
                onUpdateName={(name) => {
                  updateProject(project.id, { name });
                  setEditingId(null);
                }}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => deleteProject(project.id)}
                onAddCategory={() => createCategory(project.id)}
                onAddCustom={(categoryId) => createCustom(project.id, categoryId)}
                onToggleCategory={toggleCategory}
                onSelectCategory={(id) => {
                  if (!expandedCategories.has(id)) toggleCategory(id);
                  setActiveCategory(id);
                }}
                onUpdateCategory={(id, name) => {
                  updateCategory(id, { name });
                  setEditingId(null);
                }}
                onDeleteCategory={deleteCategory}
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

// Tree line component
function TreeLine({ isLast }: { isLast: boolean }) {
  return (
    <div className="w-3 flex-shrink-0 relative">
      <div
        className="absolute left-1.5 top-0 w-px bg-[var(--border)]"
        style={{ height: isLast ? '50%' : '100%' }}
      />
      <div className="absolute left-1.5 top-1/2 w-1.5 h-px bg-[var(--border)]" />
    </div>
  );
}

interface ProjectItemProps {
  project: {
    id: string;
    name: string;
    categories: Array<{ id: string; name: string; customs: Array<{ id: string; name: string }> }>;
    customs: Array<{ id: string; name: string }>;
  };
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
  onAddCustom: (categoryId?: string) => void;
  onToggleCategory: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onSelectCustom: (id: string) => void;
  onUpdateCustom: (id: string, name: string) => void;
  onDeleteCustom: (id: string) => void;
}

function ProjectItem({
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
  onAddCustom,
  onToggleCategory,
  onSelectCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSelectCustom,
  onUpdateCustom,
  onDeleteCustom,
}: ProjectItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: 'project', parentId: null, name: project.name },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalItems = project.categories.length + project.customs.length;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center h-7 px-1 rounded transition-colors duration-100 ${
          isActive ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover)]'
        }`}
      >
        <button {...attributes} {...listeners} className="p-0.5 cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-[var(--muted)]" />
        </button>
        <button onClick={onToggle} className="p-0.5">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />
          )}
        </button>
        <Folder className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-[var(--active-text)]' : 'text-[var(--muted)]'}`} />
        <div className="flex-1 min-w-0" onDoubleClick={() => onStartEdit(project.id)}>
          <button onClick={onSelect} className="w-full text-left">
            <EditableText
              value={project.name}
              isEditing={editingId === project.id}
              onSave={onUpdateName}
              onCancel={onCancelEdit}
              className={`text-xs truncate ${isActive ? 'text-[var(--active-text)] font-medium' : ''}`}
            />
          </button>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddCustom()} className="p-1 hover:bg-[var(--active-bg)] rounded" title="Add Custom">
            <Plus className="w-3 h-3 text-[var(--muted)]" />
          </button>
          <button onClick={onAddCategory} className="p-1 hover:bg-[var(--active-bg)] rounded" title="Add Category">
            <Box className="w-3 h-3 text-[var(--muted)]" />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-500/10 rounded" title="Delete">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-4 mt-1 space-y-0.5">
          {/* Project-level customs */}
          <SortableContext items={project.customs.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {project.customs.map((custom, idx) => (
              <CustomItem
                key={custom.id}
                custom={custom}
                projectId={project.id}
                isActive={activeCustomId === custom.id}
                editingId={editingId}
                isLast={idx === project.customs.length - 1 && project.categories.length === 0}
                onSelect={() => onSelectCustom(custom.id)}
                onStartEdit={onStartEdit}
                onUpdateName={(name) => onUpdateCustom(custom.id, name)}
                onCancelEdit={onCancelEdit}
                onDelete={() => onDeleteCustom(custom.id)}
              />
            ))}
          </SortableContext>

          {/* Spacing between customs and categories */}
          {project.customs.length > 0 && project.categories.length > 0 && <div className="h-1.5" />}

          {/* Categories */}
          <SortableContext items={project.categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {project.categories.map((category, catIdx) => (
              <CategoryItem
                key={category.id}
                category={category}
                projectId={project.id}
                isExpanded={expandedCategories.has(category.id)}
                isActive={activeCategoryId === category.id}
                editingId={editingId}
                activeCustomId={activeCustomId}
                isLast={catIdx === project.categories.length - 1}
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

interface CategoryItemProps {
  category: { id: string; name: string; customs: Array<{ id: string; name: string }> };
  projectId: string;
  isExpanded: boolean;
  isActive: boolean;
  editingId: string | null;
  activeCustomId: string | null;
  isLast: boolean;
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

function CategoryItem({
  category,
  projectId,
  isExpanded,
  isActive,
  editingId,
  activeCustomId,
  isLast,
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
}: CategoryItemProps) {
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
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center">
        <TreeLine isLast={isLast && !isExpanded} />
        <div
          className={`group flex-1 flex items-center h-6 pr-1 rounded transition-colors duration-100 ${
            isActive ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover)]'
          }`}
        >
          <button {...attributes} {...listeners} className="p-0.5 cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
            <GripVertical className="w-2.5 h-2.5 text-[var(--muted)]" />
          </button>
          <button onClick={onToggle} className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-[var(--muted)]" />
            ) : (
              <ChevronRight className="w-3 h-3 text-[var(--muted)]" />
            )}
          </button>
          <Box className={`w-3 h-3 mr-1.5 ${isActive ? 'text-[var(--active-text)]' : 'text-[var(--muted)]'}`} />
          <div className="flex-1 min-w-0" onDoubleClick={() => onStartEdit(category.id)}>
            <button onClick={onSelect} className="w-full text-left">
              <EditableText
                value={category.name}
                isEditing={editingId === category.id}
                onSave={onUpdateName}
                onCancel={onCancelEdit}
                className={`text-xs truncate ${isActive ? 'text-[var(--active-text)] font-medium' : 'text-[var(--muted)]'}`}
              />
            </button>
          </div>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onAddCustom} className="p-0.5 hover:bg-[var(--active-bg)] rounded" title="Add Custom">
              <Plus className="w-2.5 h-2.5 text-[var(--muted)]" />
            </button>
            <button onClick={onDelete} className="p-0.5 hover:bg-red-500/10 rounded" title="Delete">
              <Trash2 className="w-2.5 h-2.5 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="flex">
          <div className="w-3 flex-shrink-0 relative">
            {!isLast && <div className="absolute left-1.5 top-0 bottom-0 w-px bg-[var(--border)]" />}
          </div>
          <div className="flex-1 ml-3">
            <SortableContext items={category.customs.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {category.customs.map((custom, idx) => (
                <CustomItem
                  key={custom.id}
                  custom={custom}
                  projectId={projectId}
                  categoryId={category.id}
                  isActive={activeCustomId === custom.id}
                  editingId={editingId}
                  isLast={idx === category.customs.length - 1}
                  onSelect={() => onSelectCustom(custom.id)}
                  onStartEdit={onStartEdit}
                  onUpdateName={(name) => onUpdateCustom(custom.id, name)}
                  onCancelEdit={onCancelEdit}
                  onDelete={() => onDeleteCustom(custom.id)}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      )}
    </div>
  );
}

interface CustomItemProps {
  custom: { id: string; name: string };
  projectId: string;
  categoryId?: string;
  isActive: boolean;
  editingId: string | null;
  isLast: boolean;
  onSelect: () => void;
  onStartEdit: (id: string) => void;
  onUpdateName: (name: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function CustomItem({
  custom,
  projectId,
  categoryId,
  isActive,
  editingId,
  isLast,
  onSelect,
  onStartEdit,
  onUpdateName,
  onCancelEdit,
  onDelete,
}: CustomItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: custom.id,
    data: { type: 'custom', parentId: categoryId || projectId, projectId, isCategory: !!categoryId, name: custom.name },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center">
        <TreeLine isLast={isLast} />
        <div
          className={`group flex-1 flex items-center h-6 pr-1 rounded transition-colors duration-100 ${
            isActive ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover)]'
          }`}
        >
          <button {...attributes} {...listeners} className="p-0.5 cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
            <GripVertical className="w-2.5 h-2.5 text-[var(--muted)]" />
          </button>
          <FileCode className={`w-3 h-3 mr-1.5 ${isActive ? 'text-[var(--active-text)]' : 'text-[var(--muted)]'}`} />
          <div className="flex-1 min-w-0" onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(custom.id); }}>
            <button onClick={onSelect} className="w-full text-left">
              <EditableText
                value={custom.name}
                isEditing={editingId === custom.id}
                onSave={onUpdateName}
                onCancel={onCancelEdit}
                className={`text-xs truncate ${isActive ? 'text-[var(--active-text)] font-medium' : ''}`}
              />
            </button>
          </div>
          <button
            onClick={onDelete}
            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-opacity"
            title="Delete"
          >
            <Trash2 className="w-2.5 h-2.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
