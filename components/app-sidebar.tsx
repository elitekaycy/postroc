'use client';

import { useWorkspaceStore } from '@/lib/store/workspace-store';
import { useNavigation } from '@/lib/hooks/use-navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronRight,
  Folder,
  Box,
  Code2,
  Plus,
  Trash2,
  MoreHorizontal,
  Download,
  Upload,
  Trash,
  ChevronsUpDown,
  Pencil,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ExportDialog } from '@/components/dialogs/export-dialog';
import { ImportDialog } from '@/components/dialogs/import-dialog';
// CLI sync hidden for now
// import {
//   isFileSystemAccessSupported,
//   syncAllWorkspacesToCLI,
//   hasCLISyncConfigured,
//   getSyncDirectoryName,
//   clearDirectoryHandle,
// } from '@/lib/cli-sync';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Inline editable text component
function EditableText({
  value,
  isEditing,
  onSave,
  onCancel,
  className = '',
}: {
  value: string;
  isEditing: boolean;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editValue.trim()) {
        onSave(editValue.trim());
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onCancel();
    }
  };

  const handleBlur = () => {
    if (editValue.trim() && editValue !== value) {
      onSave(editValue.trim());
    } else {
      setEditValue(value);
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        className={`bg-transparent border border-ring rounded px-1 py-0 text-sm outline-none w-full min-w-0 ${className}`}
      />
    );
  }

  return <span className={`truncate ${className}`}>{value}</span>;
}


// Type for drag data
type DragItem = {
  type: 'project' | 'category' | 'custom';
  id: string;
  parentId?: string; // projectId for categories/customs, categoryId for category customs
  isInCategory?: boolean;
};

// Import types
import type { Project, Category, Custom } from '@/lib/types/core';

// Sortable Project Item
function SortableProjectItem({
  project,
  isActive,
  isEditing,
  activeCustomId,
  activeCategoryId,
  editingId,
  onNavigate,
  onNavigateToCustom,
  onNavigateToCategory,
  onEdit,
  onSaveName,
  onCancelEdit,
  onCreateCustom,
  onCreateCategory,
  onDeleteProject,
  onDeleteCategory,
  onDeleteCustom,
  onEditCategory,
  onSaveCategoryName,
  onEditCustom,
  onSaveCustomName,
  overId,
  activeItem,
  onMoveToProjectLevel,
  isExpanded,
  onToggleExpand,
  expandedCategories,
  onToggleCategoryExpand,
}: {
  project: Project;
  isActive: boolean;
  isEditing: boolean;
  activeCustomId: string | null;
  activeCategoryId: string | null;
  editingId: string | null;
  onNavigate: () => void;
  onNavigateToCustom: (id: string) => void;
  onNavigateToCategory: (id: string) => void;
  onEdit: () => void;
  onSaveName: (name: string) => void;
  onCancelEdit: () => void;
  onCreateCustom: (categoryId?: string) => void;
  onCreateCategory: () => void;
  onDeleteProject: () => void;
  onDeleteCategory: (id: string) => void;
  onDeleteCustom: (id: string) => void;
  onEditCategory: (id: string) => void;
  onSaveCategoryName: (id: string, name: string) => void;
  onEditCustom: (id: string) => void;
  onSaveCustomName: (id: string, name: string) => void;
  overId: string | null;
  activeItem: DragItem | null;
  onMoveToProjectLevel: (customId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedCategories: Set<string>;
  onToggleCategoryExpand: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    data: { type: 'project', id: project.id } as DragItem,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Droppable zone for moving customs to project level
  const { setNodeRef: setDroppableRef, isOver: isOverProjectLevel } = useDroppable({
    id: `project-drop-${project.id}`,
    data: { type: 'project-drop', projectId: project.id },
  });

  // Show drop zone when dragging a custom that's in a category
  const showProjectDropZone = activeItem?.type === 'custom' && activeItem.isInCategory;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand} className="group/collapsible">
      <SidebarMenuItem ref={setNodeRef} style={style} className="group/item">
        {isEditing ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Folder className="h-3 w-3 shrink-0" />
            <EditableText
              value={project.name}
              isEditing={true}
              onSave={onSaveName}
              onCancel={onCancelEdit}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
              <CollapsibleTrigger asChild>
                <button className="p-0.5 hover:bg-sidebar-accent/50 rounded transition-colors cursor-pointer">
                  <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </button>
              </CollapsibleTrigger>
              <SidebarMenuButton isActive={isActive} onClick={onNavigate} className="flex-1">
                <Folder className="h-3 w-3" />
                <span className="truncate">{project.name}</span>
              </SidebarMenuButton>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal className="h-3 w-3" />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-3 w-3" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onCreateCustom()}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Custom
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateCategory}>
                  <Box className="mr-2 h-3 w-3" />
                  Add Category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDeleteProject} className="text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <CollapsibleContent>
          <SidebarMenuSub>
            {/* Drop zone for moving customs to project level */}
            {showProjectDropZone && (
              <div
                ref={setDroppableRef}
                className={`mx-2 my-1 p-2 border-2 border-dashed rounded-md text-xs text-center transition-colors ${
                  isOverProjectLevel
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                Drop here to move to project level
              </div>
            )}
            {/* Project-level customs */}
            <SortableContext
              items={project.customs.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {project.customs.map((custom) => (
                <SortableCustomItem
                  key={custom.id}
                  custom={custom}
                  projectId={project.id}
                  isActive={activeCustomId === custom.id}
                  isEditing={editingId === custom.id}
                  onNavigate={() => onNavigateToCustom(custom.id)}
                  onEdit={() => onEditCustom(custom.id)}
                  onSaveName={(name) => onSaveCustomName(custom.id, name)}
                  onCancelEdit={onCancelEdit}
                  onDelete={() => onDeleteCustom(custom.id)}
                  isInCategory={false}
                  isDropTarget={overId === custom.id}
                />
              ))}
            </SortableContext>
            {/* Categories */}
            <SortableContext
              items={project.categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {project.categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  projectId={project.id}
                  isActive={activeCategoryId === category.id}
                  isEditing={editingId === category.id}
                  activeCustomId={activeCustomId}
                  editingId={editingId}
                  onNavigate={() => onNavigateToCategory(category.id)}
                  onNavigateToCustom={onNavigateToCustom}
                  onEdit={() => onEditCategory(category.id)}
                  onSaveName={(name) => onSaveCategoryName(category.id, name)}
                  onCancelEdit={onCancelEdit}
                  onCreateCustom={() => onCreateCustom(category.id)}
                  onDelete={() => onDeleteCategory(category.id)}
                  onEditCustom={onEditCustom}
                  onSaveCustomName={onSaveCustomName}
                  onDeleteCustom={onDeleteCustom}
                  overId={overId}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggleExpand={() => onToggleCategoryExpand(category.id)}
                />
              ))}
            </SortableContext>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// Sortable Category Item
function SortableCategoryItem({
  category,
  projectId,
  isActive,
  isEditing,
  activeCustomId,
  editingId,
  onNavigate,
  onNavigateToCustom,
  onEdit,
  onSaveName,
  onCancelEdit,
  onCreateCustom,
  onDelete,
  onEditCustom,
  onSaveCustomName,
  onDeleteCustom,
  overId,
  isExpanded,
  onToggleExpand,
}: {
  category: Category;
  projectId: string;
  isActive: boolean;
  isEditing: boolean;
  activeCustomId: string | null;
  editingId: string | null;
  onNavigate: () => void;
  onNavigateToCustom: (id: string) => void;
  onEdit: () => void;
  onSaveName: (name: string) => void;
  onCancelEdit: () => void;
  onCreateCustom: () => void;
  onDelete: () => void;
  onEditCustom: (id: string) => void;
  onSaveCustomName: (id: string, name: string) => void;
  onDeleteCustom: (id: string) => void;
  overId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: { type: 'category', id: category.id, parentId: projectId } as DragItem,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDropTarget = overId === category.id;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand} className="group/category">
      <SidebarMenuSubItem
        ref={setNodeRef}
        style={style}
        className={`group/item ${isDropTarget ? 'ring-2 ring-primary ring-offset-1 rounded' : ''}`}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 px-2 py-1">
            <Box className="h-3 w-3 shrink-0" />
            <EditableText
              value={category.name}
              isEditing={true}
              onSave={onSaveName}
              onCancel={onCancelEdit}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center pr-2 cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
              <CollapsibleTrigger asChild>
                <button className="p-0.5 hover:bg-sidebar-accent/50 rounded transition-colors cursor-pointer">
                  <ChevronRight className="h-3 w-3 shrink-0 transition-transform group-data-[state=open]/category:rotate-90" />
                </button>
              </CollapsibleTrigger>
              <SidebarMenuSubButton isActive={isActive} onClick={onNavigate} className="flex-1">
                <Box className="h-3 w-3" />
                <span className="truncate flex-1">{category.name}</span>
              </SidebarMenuSubButton>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal className="h-3 w-3" />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-3 w-3" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateCustom}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Custom
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <CollapsibleContent>
          <SidebarMenuSub className="ml-2 border-l-0">
            <SortableContext
              items={category.customs.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {category.customs.map((custom) => (
                <SortableCustomItem
                  key={custom.id}
                  custom={custom}
                  projectId={projectId}
                  categoryId={category.id}
                  isActive={activeCustomId === custom.id}
                  isEditing={editingId === custom.id}
                  onNavigate={() => onNavigateToCustom(custom.id)}
                  onEdit={() => onEditCustom(custom.id)}
                  onSaveName={(name) => onSaveCustomName(custom.id, name)}
                  onCancelEdit={onCancelEdit}
                  onDelete={() => onDeleteCustom(custom.id)}
                  isInCategory={true}
                  isDropTarget={overId === custom.id}
                />
              ))}
            </SortableContext>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                onClick={onCreateCustom}
                size="sm"
                className="text-muted-foreground"
              >
                <Plus className="h-3 w-3" />
                <span>Add Custom</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  );
}

// Sortable Custom Item
function SortableCustomItem({
  custom,
  projectId,
  categoryId,
  isActive,
  isEditing,
  onNavigate,
  onEdit,
  onSaveName,
  onCancelEdit,
  onDelete,
  isInCategory,
  isDropTarget,
}: {
  custom: Custom;
  projectId: string;
  categoryId?: string;
  isActive: boolean;
  isEditing: boolean;
  onNavigate: () => void;
  onEdit: () => void;
  onSaveName: (name: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isInCategory: boolean;
  isDropTarget: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: custom.id,
    data: {
      type: 'custom',
      id: custom.id,
      parentId: isInCategory ? categoryId : projectId,
      isInCategory,
    } as DragItem,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <SidebarMenuSubItem ref={setNodeRef} style={style} className="group/item">
      {isEditing ? (
        <div className="flex items-center gap-2 px-2 py-1">
          <Code2 className={isInCategory ? 'h-3 w-3 shrink-0' : 'h-3 w-3 shrink-0'} />
          <EditableText
            value={custom.name}
            isEditing={true}
            onSave={onSaveName}
            onCancel={onCancelEdit}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center pr-2 cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
            <span className="w-4" /> {/* Spacer to align with chevrons */}
            <SidebarMenuSubButton
              isActive={isActive}
              onClick={onNavigate}
              size={isInCategory ? 'sm' : undefined}
              className="flex-1"
            >
              <Code2 className="h-3 w-3" />
              <span className="truncate">{custom.name}</span>
            </SidebarMenuSubButton>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal className="h-3 w-3" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-3 w-3" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </SidebarMenuSubItem>
  );
}

export function AppSidebar() {
  const {
    workspaces,
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    activeCustomId,
    editingId,
    setEditingId,
    setActiveWorkspace,
    createWorkspace,
    createProject,
    createCategory,
    createCustom,
    updateWorkspace,
    updateProject,
    updateCategory,
    updateCustom,
    deleteWorkspace,
    deleteProject,
    deleteCategory,
    deleteCustom,
    clearAllData,
    reorderProjects,
    reorderCategories,
    reorderCustoms,
    moveCustom,
  } = useWorkspaceStore();

  const { navigateToProject, navigateToCategory, navigateToCustom } = useNavigation();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Expanded state tracking for projects and categories
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const toggleProjectExpand = useCallback((id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleCategoryExpand = useCallback((id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // CLI Sync state (hidden for now)
  // const [isSyncing, setIsSyncing] = useState(false);
  // const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // const [syncMessage, setSyncMessage] = useState<string | null>(null);
  // const [syncDirName, setSyncDirName] = useState<string | null>(null);
  // const [fsApiSupported, setFsApiSupported] = useState(true);

  // CLI sync handlers hidden for now
  // const { exportWorkspaceToJSON } = useWorkspaceStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId]
  );

  // Initialize expanded state and auto-expand new items
  useEffect(() => {
    if (!activeWorkspace) return;

    if (!initialized) {
      // First load: expand all
      setExpandedProjects(new Set(activeWorkspace.projects.map((p) => p.id)));
      const catIds: string[] = [];
      activeWorkspace.projects.forEach((p) => {
        p.categories.forEach((c) => catIds.push(c.id));
      });
      setExpandedCategories(new Set(catIds));
      setInitialized(true);
    } else {
      // Subsequent updates: auto-expand any new project/category
      setExpandedProjects((prev) => {
        const next = new Set(prev);
        activeWorkspace.projects.forEach((p) => {
          if (!prev.has(p.id)) next.add(p.id);
        });
        return next;
      });
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        activeWorkspace.projects.forEach((p) => {
          p.categories.forEach((c) => {
            if (!prev.has(c.id)) next.add(c.id);
          });
        });
        return next;
      });
    }
  }, [activeWorkspace, initialized]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveItem(active.data.current as DragItem);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string || null);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current as DragItem;
    const overData = over.data.current as DragItem | undefined;

    if (activeData.type === 'project' && activeWorkspaceId) {
      // Reorder projects
      const projects = activeWorkspace?.projects || [];
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(projects.map((p) => p.id), oldIndex, newIndex);
        reorderProjects(activeWorkspaceId, newOrder);
      }
    } else if (activeData.type === 'category' && activeData.parentId) {
      // Reorder categories within project
      const project = activeWorkspace?.projects.find((p) => p.id === activeData.parentId);
      if (project) {
        const oldIndex = project.categories.findIndex((c) => c.id === active.id);
        const newIndex = project.categories.findIndex((c) => c.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(project.categories.map((c) => c.id), oldIndex, newIndex);
          reorderCategories(activeData.parentId, newOrder);
        }
      }
    } else if (activeData.type === 'custom') {
      // Find the project that contains the custom being dragged
      let sourceProjectId: string | null = null;

      if (activeData.isInCategory && activeData.parentId) {
        // Find project containing this category
        const project = activeWorkspace?.projects.find((p) =>
          p.categories.some((c) => c.id === activeData.parentId)
        );
        sourceProjectId = project?.id || null;
      } else {
        sourceProjectId = activeData.parentId || null;
      }

      if (!sourceProjectId) return;

      // Handle dropping on project-drop zone - move custom to project level
      const overDataAny = over.data.current as { type?: string; projectId?: string } | undefined;
      if (overDataAny?.type === 'project-drop' && overDataAny.projectId) {
        moveCustom(activeData.id as string, overDataAny.projectId, undefined);
        setExpandedProjects((prev) => new Set(prev).add(overDataAny.projectId!));
        return;
      }

      // Handle dropping on a category - move custom into that category
      if (overData?.type === 'category') {
        moveCustom(activeData.id as string, sourceProjectId, over.id as string);
        setExpandedCategories((prev) => new Set(prev).add(over.id as string));
      }
      // Handle dropping on a project-level custom - move to project level or reorder
      else if (overData?.type === 'custom' && !overData.isInCategory) {
        // Target is a project-level custom
        if (activeData.isInCategory) {
          // Moving from category to project level (no category)
          moveCustom(activeData.id as string, sourceProjectId, undefined);
        } else if (activeData.parentId && activeData.parentId === overData.parentId) {
          // Reordering within same project level
          const project = activeWorkspace?.projects.find((p) => p.id === activeData.parentId);
          if (project) {
            const oldIndex = project.customs.findIndex((c) => c.id === active.id);
            const newIndex = project.customs.findIndex((c) => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              const newOrder = arrayMove(project.customs.map((c) => c.id), oldIndex, newIndex);
              reorderCustoms(activeData.parentId, newOrder, false);
            }
          }
        }
      }
      // Handle dropping on a category-level custom - move to that category or reorder
      else if (overData?.type === 'custom' && overData.isInCategory && overData.parentId) {
        if (activeData.parentId === overData.parentId && activeData.isInCategory) {
          // Reordering within same category
          const project = activeWorkspace?.projects.find((p) =>
            p.categories.some((c) => c.id === activeData.parentId)
          );
          const category = project?.categories.find((c) => c.id === activeData.parentId);
          if (category) {
            const oldIndex = category.customs.findIndex((c) => c.id === active.id);
            const newIndex = category.customs.findIndex((c) => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              const newOrder = arrayMove(category.customs.map((c) => c.id), oldIndex, newIndex);
              reorderCustoms(activeData.parentId, newOrder, true);
            }
          }
        } else {
          // Moving to a different category
          moveCustom(activeData.id as string, sourceProjectId, overData.parentId);
        }
      }
    }
  };

  if (workspaces.length === 0) {
    return (
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="w-full justify-between">
                <span className="font-semibold">PostRoc</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-sm text-muted-foreground mb-4">No workspaces yet</p>
            <button
              onClick={() => createWorkspace()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Create Workspace
            </button>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              {editingId === activeWorkspaceId ? (
                <div className="px-3 py-2">
                  <EditableText
                    value={activeWorkspace?.name || ''}
                    isEditing={true}
                    onSave={(newName) => {
                      if (activeWorkspaceId) {
                        updateWorkspace(activeWorkspaceId, { name: newName });
                      }
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                    className="font-semibold"
                  />
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" className="w-full justify-between">
                      <span className="font-semibold truncate">{activeWorkspace?.name || 'Workspace'}</span>
                      <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 opacity-50" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {workspaces.map((workspace) => (
                      <DropdownMenuItem
                        key={workspace.id}
                        onClick={() => setActiveWorkspace(workspace.id)}
                        className={workspace.id === activeWorkspaceId ? 'bg-accent' : ''}
                      >
                        {workspace.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => activeWorkspaceId && setEditingId(activeWorkspaceId)}>
                      <Pencil className="mr-2 h-3 w-3" />
                      Rename Workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => createWorkspace()}>
                      <Plus className="mr-2 h-3 w-3" />
                      New Workspace
                    </DropdownMenuItem>
                    {workspaces.length > 1 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (activeWorkspaceId && confirm('Delete this workspace?')) {
                              deleteWorkspace(activeWorkspaceId);
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete Workspace
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupAction
              title="Add Project"
              onClick={() => activeWorkspaceId && createProject(activeWorkspaceId)}
            >
              <Plus className="h-3 w-3" />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SortableContext
                items={activeWorkspace?.projects.map((p) => p.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <SidebarMenu>
                  {activeWorkspace?.projects.map((project) => (
                    <SortableProjectItem
                      key={project.id}
                      project={project}
                      isActive={activeProjectId === project.id}
                      isEditing={editingId === project.id}
                      activeCustomId={activeCustomId}
                      activeCategoryId={activeCategoryId}
                      editingId={editingId}
                      onNavigate={() => navigateToProject(project.id)}
                      onNavigateToCustom={navigateToCustom}
                      onNavigateToCategory={navigateToCategory}
                      onEdit={() => setEditingId(project.id)}
                      onSaveName={(name) => {
                        updateProject(project.id, { name });
                        setEditingId(null);
                      }}
                      onCancelEdit={() => setEditingId(null)}
                      onCreateCustom={(categoryId) => {
                        createCustom(project.id, categoryId);
                        // Expand the project
                        setExpandedProjects((prev) => new Set(prev).add(project.id));
                        // If adding to a category, expand it too
                        if (categoryId) {
                          setExpandedCategories((prev) => new Set(prev).add(categoryId));
                        }
                      }}
                      onCreateCategory={() => {
                        createCategory(project.id);
                        // Expand the project to show the new category
                        setExpandedProjects((prev) => new Set(prev).add(project.id));
                      }}
                      onDeleteProject={() => deleteProject(project.id)}
                      onDeleteCategory={deleteCategory}
                      onDeleteCustom={deleteCustom}
                      onEditCategory={(id) => setEditingId(id)}
                      onSaveCategoryName={(id, name) => {
                        updateCategory(id, { name });
                        setEditingId(null);
                      }}
                      onEditCustom={(id) => setEditingId(id)}
                      onSaveCustomName={(id, name) => {
                        updateCustom(id, { name });
                        setEditingId(null);
                      }}
                      overId={overId}
                      activeItem={activeItem}
                      onMoveToProjectLevel={(customId) => moveCustom(customId, project.id, undefined)}
                      isExpanded={expandedProjects.has(project.id)}
                      onToggleExpand={() => toggleProjectExpand(project.id)}
                      expandedCategories={expandedCategories}
                      onToggleCategoryExpand={toggleCategoryExpand}
                    />
                  ))}
                </SidebarMenu>
              </SortableContext>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            {/* CLI Sync Button - hidden for now */}
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <MoreHorizontal className="h-3 w-3" />
                    <span>More</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                    <Download className="mr-2 h-3 w-3" />
                    Export...
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                    <Upload className="mr-2 h-3 w-3" />
                    Import...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                        clearAllData();
                      }
                    }}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-3 w-3" />
                    Clear All Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <ExportDialog isOpen={showExportDialog} onClose={() => setShowExportDialog(false)} />
      <ImportDialog isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} />

      <DragOverlay>
        {activeItem ? (
          <div className="bg-sidebar border border-sidebar-border rounded-md px-3 py-2 shadow-lg text-sm">
            {activeItem.type === 'project' && <Folder className="h-3 w-3 inline mr-2" />}
            {activeItem.type === 'category' && <Box className="h-3 w-3 inline mr-2" />}
            {activeItem.type === 'custom' && <Code2 className="h-3 w-3 inline mr-2" />}
            <span>Dragging...</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
