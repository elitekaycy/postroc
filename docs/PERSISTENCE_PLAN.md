# Workspace Persistence & Export/Import Plan

## Overview

Implement two persistence mechanisms:
1. **Auto-persistence**: Automatically save workspace state to browser localStorage
2. **Export/Import**: Download/upload JSON files for sharing (like Postman collections)

---

## 1. Auto-Persistence (localStorage)

### Implementation

**File to create**: `lib/store/persistence.ts`

```typescript
// Zustand persist middleware configuration
import { persist, createJSONStorage } from 'zustand/middleware';

const STORAGE_KEY = 'postroc-workspaces';
const STORAGE_VERSION = 1;

// Add persist middleware to workspace-store.ts
export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    immer((set, get) => ({
      // ... existing store implementation
    })),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        activeProjectId: state.activeProjectId,
        activeCategoryId: state.activeCategoryId,
        activeCustomId: state.activeCustomId,
      }),
      migrate: (persistedState, version) => {
        // Handle future schema migrations here
        return persistedState;
      },
    }
  )
);
```

### Benefits
- Data survives page refresh
- No manual save required
- Seamless user experience

---

## 2. Export/Import (Portable JSON Files)

### Export File Format

```typescript
interface PostrocExport {
  // Schema version for future compatibility
  version: '1.0.0';

  // Export timestamp
  exportedAt: number;

  // Export type determines what's included
  type: 'workspace' | 'project' | 'category';

  // The exported data (structure depends on type)
  data: Workspace | Project | Category;
}
```

### Example Export File: `my-api-workspace.postroc.json`

```json
{
  "version": "1.0.0",
  "exportedAt": 1705673200000,
  "type": "workspace",
  "data": {
    "id": "ws-123",
    "name": "My API Workspace",
    "projects": [
      {
        "id": "proj-456",
        "name": "User Service",
        "workspaceId": "ws-123",
        "categories": [...],
        "customs": [...],
        "createdAt": 1705670000000
      }
    ],
    "createdAt": 1705670000000
  }
}
```

### Export Granularity

| Level | What's Exported | Use Case |
|-------|-----------------|----------|
| Workspace | All projects, categories, customs | Full backup / team sharing |
| Project | Single project with all categories & customs | Share specific API collection |
| Category | Single category with config & customs | Share endpoint group |

---

## 3. Implementation Details

### Files to Create

1. **`lib/export/workspace-export.ts`** - Export logic
2. **`lib/export/workspace-import.ts`** - Import logic with ID regeneration
3. **`components/sidebar/export-import-menu.tsx`** - UI dropdown menu

### Export Functions

```typescript
// lib/export/workspace-export.ts
export interface ExportOptions {
  type: 'workspace' | 'project' | 'category';
  id: string;
  includeSecrets?: boolean; // Option to strip auth tokens/passwords
}

export function exportToJSON(
  workspaces: Workspace[],
  options: ExportOptions
): string {
  const data = extractExportData(workspaces, options);

  // Optionally strip sensitive data
  if (!options.includeSecrets) {
    data = stripSensitiveData(data);
  }

  const exportObj: PostrocExport = {
    version: '1.0.0',
    exportedAt: Date.now(),
    type: options.type,
    data,
  };

  return JSON.stringify(exportObj, null, 2);
}

export function downloadExport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Import Functions

```typescript
// lib/export/workspace-import.ts
export interface ImportOptions {
  mode: 'replace' | 'merge' | 'import-as-new';
}

export interface ImportResult {
  success: boolean;
  error?: string;
  imported?: {
    workspaces?: number;
    projects?: number;
    categories?: number;
    customs?: number;
  };
}

export function validateImport(content: string): PostrocExport | null {
  try {
    const parsed = JSON.parse(content);
    if (!parsed.version || !parsed.type || !parsed.data) {
      return null;
    }
    // Validate version compatibility
    if (!isVersionCompatible(parsed.version)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function importFromJSON(
  exportData: PostrocExport,
  options: ImportOptions
): ImportData {
  // CRITICAL: Regenerate all IDs to avoid conflicts
  const reIdedData = regenerateAllIds(exportData.data);

  return {
    type: exportData.type,
    data: reIdedData,
    mode: options.mode,
  };
}

// Recursively regenerate all IDs in the data structure
function regenerateAllIds(data: any): any {
  const idMap = new Map<string, string>();

  const generateNewId = (oldId: string) => {
    if (!idMap.has(oldId)) {
      idMap.set(oldId, crypto.randomUUID());
    }
    return idMap.get(oldId)!;
  };

  // Deep clone and replace IDs, also update references (referenceId, projectId, etc.)
  return deepCloneWithNewIds(data, generateNewId);
}
```

### Store Actions to Add

```typescript
// Add to workspace-store.ts
interface WorkspaceStore {
  // ... existing actions

  // Export/Import
  exportWorkspace: (workspaceId: string) => string;
  exportProject: (projectId: string) => string;
  exportCategory: (categoryId: string) => string;

  importData: (data: PostrocExport, mode: ImportMode) => ImportResult;

  // Bulk operations
  clearAllData: () => void;
  replaceAllData: (workspaces: Workspace[]) => void;
}
```

---

## 4. UI Implementation

### Export Menu (Sidebar Header)

```
┌─────────────────────────────────┐
│ My Workspace        [+] [⋮]    │
└─────────────────────────────────┘
                          │
                          ▼
                   ┌───────────────┐
                   │ Export...     │
                   │ Import...     │
                   │ ───────────── │
                   │ Clear All     │
                   └───────────────┘
```

### Export Dialog

```
┌──────────────────────────────────────────┐
│  Export                            [x]   │
├──────────────────────────────────────────┤
│                                          │
│  What to export:                         │
│  ○ Entire Workspace                      │
│  ○ Current Project                       │
│  ○ Current Category                      │
│                                          │
│  Options:                                │
│  □ Include auth tokens/passwords         │
│                                          │
│  Filename: my-workspace.postroc.json     │
│                                          │
│              [Cancel]  [Export]          │
└──────────────────────────────────────────┘
```

### Import Dialog

```
┌──────────────────────────────────────────┐
│  Import                            [x]   │
├──────────────────────────────────────────┤
│                                          │
│  [  Drop file here or click to browse  ] │
│                                          │
│  Import mode:                            │
│  ○ Import as new (keep existing)         │
│  ○ Merge with existing                   │
│  ○ Replace all (clear existing first)    │
│                                          │
│  Preview:                                │
│  ┌────────────────────────────────────┐  │
│  │ Workspace: "My API"                │  │
│  │ Projects: 3                        │  │
│  │ Categories: 8                      │  │
│  │ Customs: 24                        │  │
│  └────────────────────────────────────┘  │
│                                          │
│              [Cancel]  [Import]          │
└──────────────────────────────────────────┘
```

---

## 5. Implementation Steps

### Phase 1: Auto-Persistence (1 task)
1. Add Zustand persist middleware to workspace-store.ts
2. Test data survives page refresh

### Phase 2: Export Core (3 tasks)
1. Create `lib/export/workspace-export.ts` with export functions
2. Add export actions to workspace-store
3. Implement download functionality

### Phase 3: Import Core (3 tasks)
1. Create `lib/export/workspace-import.ts` with validation and ID regeneration
2. Add import actions to workspace-store
3. Handle merge/replace/import-as-new modes

### Phase 4: UI (2 tasks)
1. Create export dialog component
2. Create import dialog component with drag-drop file upload

### Phase 5: Integration (1 task)
1. Add export/import menu to sidebar
2. Wire up dialogs and store actions

---

## 6. Security Considerations

### Sensitive Data Handling

Auth tokens, API keys, and passwords should be optionally excluded from exports:

```typescript
const SENSITIVE_FIELDS = ['token', 'apiKeyValue', 'password'];

function stripSensitiveData(data: any): any {
  // Recursively remove/mask sensitive fields
  for (const field of SENSITIVE_FIELDS) {
    if (data[field]) {
      data[field] = '***REDACTED***';
    }
  }
  // Handle nested auth configs in categories
  if (data.config?.auth) {
    for (const field of SENSITIVE_FIELDS) {
      if (data.config.auth[field]) {
        data.config.auth[field] = '***REDACTED***';
      }
    }
  }
  return data;
}
```

### Import Validation

Before importing, validate:
1. Version compatibility
2. Required fields present
3. Data structure matches expected schema
4. No circular references in custom references

---

## 7. File Naming Convention

Export files follow the pattern:
```
{name}.postroc.json
```

Examples:
- `my-api-workspace.postroc.json`
- `user-service.postroc.json`
- `auth-endpoints.postroc.json`

The `.postroc.json` extension clearly identifies the file type while remaining valid JSON.

---

## Summary

| Feature | Benefit |
|---------|---------|
| Auto-persistence | Data survives refresh, no manual saves |
| Export Workspace | Full backup, team sharing |
| Export Project | Share specific API collections |
| Export Category | Share endpoint groups |
| ID Regeneration | No conflicts on import |
| Merge/Replace modes | Flexible import options |
| Sensitive data option | Safe sharing |

This approach mirrors Postman's collection export/import pattern while being tailored to PostRoc's workspace > project > category > custom hierarchy.
