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
  ChevronDown,
  ChevronRight,
  Folder,
  Box,
  FileCode,
  Plus,
  Trash2,
  MoreHorizontal,
  Download,
  Upload,
  Trash,
  ChevronsUpDown,
} from 'lucide-react';
import { useState } from 'react';
import { ExportDialog } from '@/components/dialogs/export-dialog';
import { ImportDialog } from '@/components/dialogs/import-dialog';

export function AppSidebar() {
  const {
    workspaces,
    activeWorkspaceId,
    activeProjectId,
    activeCategoryId,
    activeCustomId,
    editingId,
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
    clearAllData,
  } = useWorkspaceStore();

  const { navigateToProject, navigateToCategory, navigateToCustom } = useNavigation();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

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
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="w-full justify-between">
                    <span className="font-semibold truncate">{activeWorkspace?.name || 'Workspace'}</span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => {
                        // Switch workspace logic would go here
                      }}
                      className={workspace.id === activeWorkspaceId ? 'bg-accent' : ''}
                    >
                      {workspace.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => createWorkspace()}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <Plus className="h-4 w-4" />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {activeWorkspace?.projects.map((project) => (
                  <Collapsible key={project.id} defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={activeProjectId === project.id}
                          onClick={() => navigateToProject(project.id)}
                        >
                          <Folder className="h-4 w-4" />
                          <span>{project.name}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal className="h-4 w-4" />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem onClick={() => createCustom(project.id)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Custom
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => createCategory(project.id)}>
                            <Box className="mr-2 h-4 w-4" />
                            Add Category
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteProject(project.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {/* Project-level customs */}
                          {project.customs.map((custom) => (
                            <SidebarMenuSubItem key={custom.id}>
                              <SidebarMenuSubButton
                                isActive={activeCustomId === custom.id}
                                onClick={() => navigateToCustom(custom.id)}
                              >
                                <FileCode className="h-4 w-4" />
                                <span>{custom.name}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                          {/* Categories */}
                          {project.categories.map((category) => (
                            <Collapsible key={category.id} defaultOpen className="group/category">
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuSubButton
                                    isActive={activeCategoryId === category.id}
                                    onClick={() => navigateToCategory(category.id)}
                                  >
                                    <Box className="h-4 w-4" />
                                    <span>{category.name}</span>
                                    <ChevronRight className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/category:rotate-90" />
                                  </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub className="ml-4 border-l-0">
                                    {category.customs.map((custom) => (
                                      <SidebarMenuSubItem key={custom.id}>
                                        <SidebarMenuSubButton
                                          isActive={activeCustomId === custom.id}
                                          onClick={() => navigateToCustom(custom.id)}
                                          size="sm"
                                        >
                                          <FileCode className="h-3 w-3" />
                                          <span>{custom.name}</span>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                    <SidebarMenuSubItem>
                                      <SidebarMenuSubButton
                                        onClick={() => createCustom(project.id, category.id)}
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
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <MoreHorizontal className="h-4 w-4" />
                    <span>More</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export...
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                    <Upload className="mr-2 h-4 w-4" />
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
                    <Trash className="mr-2 h-4 w-4" />
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
    </>
  );
}
