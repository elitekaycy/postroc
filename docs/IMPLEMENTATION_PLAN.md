# PostRoc Implementation Plan v2

## Project Overview

PostRoc is a composable API data & request orchestration platform that helps developers construct valid, dependency-aware request payloads. The MVP focuses on a frontend-first approach with browser-based state management, environment-aware API testing, and category-based organization with shared authentication and headers.

---

## Updated Architecture

### Hierarchy
```
Workspace
  └── Project
      └── Category (NEW)
          ├── Environment Config (local, staging, production)
          ├── Auth Settings (tokens, headers)
          ├── Default Headers
          └── Customs
              └── Fields
```

### Key Concepts

1. **Categories**: Group related customs with shared configuration
   - Base URLs per environment (localhost, staging, production)
   - Authentication settings (API keys, Bearer tokens, Basic auth)
   - Default headers that cascade to all customs
   - Custom-level overrides possible

2. **Environment Management**: Switch between environments dynamically
   - Local (http://localhost:3000)
   - Staging (https://staging.example.com)
   - Production (https://api.example.com)
   - Active environment selector in UI

3. **HTTP Testing**: Insomnia-style request testing
   - Send requests directly from the UI
   - View response body, headers, status
   - Use resolved data as request payload
   - Support all HTTP methods (GET, POST, PUT, PATCH, DELETE)

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **UI Components**: Radix UI + Tailwind CSS
- **Drag & Drop**: dnd-kit
- **Data Generation**: Faker.js
- **HTTP Client**: Native fetch with interceptors
- **Storage**: IndexedDB (via idb library)
- **Export**: Native APIs + xmlbuilder2

---

## Implementation Phases

### Phase 0: Enhanced Foundation
Updated type system and environment management

### Phase 1: Foundation & Setup
Core infrastructure, type system, and basic UI scaffold

### Phase 2: Categories & Configuration
Category management, environment switching, auth/headers

### Phase 3: Data Engine
Dependency resolution, data generation, and core logic

### Phase 4: HTTP Testing & Request Execution
Insomnia-style request sender and response viewer

### Phase 5: UI & Interaction
Building the workspace/project/category/custom editors

### Phase 6: Export & Integration
Multi-format export and CLI endpoint preparation

### Phase 7: Polish & Enhancement
Persistence, error handling, and UX improvements

---

## Ticket Breakdown

---

## PHASE 0: ENHANCED FOUNDATION

### Ticket 0.1: Enhanced Type Definitions
**Complexity**: Medium
**Dependencies**: None

**Tasks**:
- Create `/lib/types/core.ts` with updated interfaces:

```typescript
// Environment types
export type Environment = 'local' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  baseUrl: string;
}

// Authentication types
export type AuthType = 'none' | 'bearer' | 'api-key' | 'basic';

export interface AuthConfig {
  type: AuthType;
  // For Bearer token
  token?: string;
  // For API key
  apiKeyHeader?: string;
  apiKeyValue?: string;
  // For Basic auth
  username?: string;
  password?: string;
}

// Header types
export interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

// HTTP types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  method: HttpMethod;
  endpoint: string; // e.g., "/users/{{userId}}"
  body?: string; // Custom ID to use as body
}

// Category configuration
export interface CategoryConfig {
  id: string;
  name: string;
  projectId: string;
  environments: EnvironmentConfig[];
  activeEnvironment: Environment;
  auth: AuthConfig;
  defaultHeaders: Header[];
  createdAt: number;
  updatedAt: number;
}

// Field types
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'reference'
  | 'api-fetch'; // NEW: fetch from API

export interface Field {
  id: string;
  key: string;
  type: FieldType;
  value?: any;
  referenceId?: string; // If type is 'reference'
  apiEndpoint?: string; // If type is 'api-fetch'
  isExported: boolean;
  description?: string;
}

// Custom types
export interface Custom {
  id: string;
  name: string;
  categoryId: string; // Changed from projectId
  fields: Field[];
  requestConfig?: RequestConfig; // Optional: for customs that represent API calls
  customHeaders?: Header[]; // Override category headers
  createdAt: number;
  updatedAt: number;
}

// Category (replaces flat list in Project)
export interface Category {
  id: string;
  name: string;
  projectId: string;
  description?: string;
  config: CategoryConfig;
  customs: Custom[];
  createdAt: number;
  updatedAt: number;
}

// Project types
export interface Project {
  id: string;
  name: string;
  workspaceId: string;
  categories: Category[]; // Changed from customs
  createdAt: number;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  projects: Project[];
  createdAt: number;
}

// Export format types
export enum ExportFormat {
  JSON = 'json',
  XML = 'xml',
  FORM_DATA = 'form-data',
  URL_ENCODED = 'url-encoded',
}

// Response types (for HTTP testing)
export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  duration: number; // in ms
  error?: string;
}
```

**Acceptance Criteria**:
- ✅ All core types defined with categories
- ✅ Environment and auth types included
- ✅ HTTP testing types defined
- ✅ No TypeScript errors

---

## PHASE 1: FOUNDATION & SETUP

### Ticket 1.1: Project Initialization
**Complexity**: Small
**Dependencies**: None

**Tasks**:
- Initialize Next.js 14+ project with TypeScript
- Set up Tailwind CSS configuration
- Install core dependencies:
  ```bash
  npm install zustand immer @faker-js/faker idb @dnd-kit/core @dnd-kit/sortable xmlbuilder2
  npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select
  npm install sonner lucide-react
  npm install -D @types/node
  ```
- Configure `tsconfig.json` for strict mode
- Set up basic folder structure:
  ```
  /app
  /components
    /ui
    /workspace
    /category
    /custom
  /lib
    /engine
    /store
    /types
    /utils
    /http
    /exporters
  /public
  ```

**Acceptance Criteria**:
- ✅ Next.js app runs on `localhost:3000`
- ✅ TypeScript strict mode enabled
- ✅ All dependencies installed
- ✅ Folder structure created

---

### Ticket 1.2: Zustand Store Setup (Enhanced)
**Complexity**: Large
**Dependencies**: 0.1

**Tasks**:
- Create `/lib/store/workspace-store.ts`
- Define Zustand store with state:
  - `workspaces: Workspace[]`
  - `activeWorkspaceId: string | null`
  - `activeProjectId: string | null`
  - `activeCategoryId: string | null` (NEW)
  - `activeCustomId: string | null`
- Implement actions:
  - Workspace: `createWorkspace`, `updateWorkspace`, `deleteWorkspace`
  - Project: `createProject`, `updateProject`, `deleteProject`
  - **Category** (NEW):
    - `createCategory(projectId, name)`
    - `updateCategory(categoryId, updates)`
    - `deleteCategory(categoryId)`
    - `updateCategoryConfig(categoryId, config)`
    - `setActiveEnvironment(categoryId, env)`
  - Custom: `createCustom(categoryId, name)`, `updateCustom`, `deleteCustom`
  - Selection: `setActiveWorkspace/Project/Category/Custom(id)`
- Use `immer` middleware for immutable updates

**Example Store Structure**:
```typescript
interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  activeCategoryId: string | null;
  activeCustomId: string | null;

  // Workspace actions
  createWorkspace: (name: string) => void;
  deleteWorkspace: (id: string) => void;

  // Project actions
  createProject: (workspaceId: string, name: string) => void;
  deleteProject: (id: string) => void;

  // Category actions
  createCategory: (projectId: string, name: string) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  updateCategoryConfig: (categoryId: string, config: Partial<CategoryConfig>) => void;
  setActiveEnvironment: (categoryId: string, env: Environment) => void;

  // Custom actions
  createCustom: (categoryId: string, name: string) => void;
  updateCustom: (customId: string, updates: Partial<Custom>) => void;
  deleteCustom: (customId: string) => void;

  // Selection actions
  setActiveWorkspace: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  setActiveCategory: (id: string | null) => void;
  setActiveCustom: (id: string | null) => void;

  // Helper selectors
  getActiveCategory: () => Category | null;
  getActiveCustom: () => Custom | null;
}
```

**Acceptance Criteria**:
- ✅ Store compiles without errors
- ✅ All CRUD operations work for categories
- ✅ Environment switching updates category config
- ✅ Immutable state updates via immer

---

### Ticket 1.3: UI Layout & Navigation (Updated)
**Complexity**: Large
**Dependencies**: 1.2

**Tasks**:
- Create basic app layout in `/app/layout.tsx`
- Build sidebar component (`/components/sidebar.tsx`):
  - Workspace selector dropdown
  - Project list (collapsible)
  - **Category list** (nested under projects, collapsible)
  - Custom list (nested under categories)
  - Visual hierarchy with indentation
- Build header component (`/components/header.tsx`):
  - App title
  - Environment switcher dropdown (shows active category's environment)
  - Create new workspace/project/category/custom buttons
- Implement responsive layout with Tailwind CSS

**Acceptance Criteria**:
- ✅ Sidebar renders full hierarchy (workspace → project → category → custom)
- ✅ Categories are collapsible and show custom count
- ✅ Environment switcher in header (only visible when category selected)
- ✅ Can create entities at each level via UI
- ✅ Active items are highlighted
- ✅ Responsive layout

---

## PHASE 2: CATEGORIES & CONFIGURATION

### Ticket 2.1: Category Configuration UI
**Complexity**: Large
**Dependencies**: 1.3

**Tasks**:
- Create `/components/category/category-config.tsx`
- Display when a category is selected (separate tab/panel)
- Sections:
  1. **Basic Info**
     - Name (editable)
     - Description (textarea)

  2. **Environments**
     - List of environment configs (local, staging, production)
     - Each has: name + base URL input
     - "Add Environment" button
     - Active environment selector (radio buttons)

  3. **Authentication**
     - Auth type dropdown (none, bearer, api-key, basic)
     - Conditional inputs based on type:
       - Bearer: token input
       - API Key: header name + value inputs
       - Basic: username + password inputs

  4. **Default Headers**
     - List of headers (key-value pairs)
     - Each has: key, value, enabled toggle, delete button
     - "Add Header" button

**Example UI Structure**:
```
┌─────────────────────────────────────┐
│ Category: User Management           │
├─────────────────────────────────────┤
│ Tabs: [Overview] [Configuration]    │
├─────────────────────────────────────┤
│                                     │
│ Environments                        │
│ ○ Local      http://localhost:3000 │
│ ● Staging    https://staging.api... │
│ ○ Production https://api.prod...    │
│                                     │
│ Authentication                      │
│ Type: [Bearer Token ▼]             │
│ Token: [sk_test_123*************** ]│
│                                     │
│ Default Headers                     │
│ ☑ Content-Type: application/json   │
│ ☑ X-Client-Version: 1.0.0          │
│ [+ Add Header]                      │
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
- ✅ All configuration sections render correctly
- ✅ Can add/edit/delete environments
- ✅ Can switch active environment
- ✅ Auth type switching shows appropriate inputs
- ✅ Headers can be added/edited/deleted/toggled
- ✅ Changes save to store immediately (debounced)

---

### Ticket 2.2: Environment Switcher Component
**Complexity**: Medium
**Dependencies**: 2.1

**Tasks**:
- Create `/components/environment-switcher.tsx`
- Dropdown in header showing current environment
- Only visible when a category is active
- Quick switch between configured environments
- Visual indicator (color coding):
  - Local: 🟢 Green
  - Staging: 🟡 Yellow
  - Production: 🔴 Red

**Acceptance Criteria**:
- ✅ Shows active category's current environment
- ✅ Dropdown lists all configured environments
- ✅ Switching updates category config in store
- ✅ Color coding works
- ✅ Hidden when no category selected

---

### Ticket 2.3: Auth & Headers Inheritance System
**Complexity**: Medium
**Dependencies**: 2.1

**Tasks**:
- Create `/lib/http/request-builder.ts`
- Implement function `buildRequestHeaders(custom: Custom, category: Category): Headers`
- Logic:
  1. Start with category's default headers
  2. Add auth header based on category's auth config
  3. Override with custom's customHeaders if present
  4. Filter out disabled headers
- Implement function `getBaseUrl(category: Category): string`
  - Returns base URL for active environment

**Example**:
```typescript
export function buildRequestHeaders(
  custom: Custom,
  category: Category
): Record<string, string> {
  const headers: Record<string, string> = {};

  // 1. Add category default headers
  for (const header of category.config.defaultHeaders) {
    if (header.enabled) {
      headers[header.key] = header.value;
    }
  }

  // 2. Add auth header
  const { auth } = category.config;
  if (auth.type === 'bearer' && auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  } else if (auth.type === 'api-key' && auth.apiKeyHeader && auth.apiKeyValue) {
    headers[auth.apiKeyHeader] = auth.apiKeyValue;
  } else if (auth.type === 'basic' && auth.username && auth.password) {
    const encoded = btoa(`${auth.username}:${auth.password}`);
    headers['Authorization'] = `Basic ${encoded}`;
  }

  // 3. Override with custom headers
  if (custom.customHeaders) {
    for (const header of custom.customHeaders) {
      if (header.enabled) {
        headers[header.key] = header.value;
      }
    }
  }

  return headers;
}

export function getBaseUrl(category: Category): string {
  const env = category.config.environments.find(
    e => e.name === category.config.activeEnvironment
  );
  return env?.baseUrl || '';
}
```

**Acceptance Criteria**:
- ✅ Headers cascade correctly (category → custom)
- ✅ Auth headers generated correctly for all types
- ✅ Custom headers override category defaults
- ✅ Disabled headers are excluded
- ✅ Base URL retrieved for active environment

---

## PHASE 3: DATA ENGINE

### Ticket 3.1: Field CRUD Operations
**Complexity**: Medium
**Dependencies**: 1.2

**Tasks**:
- Extend Zustand store with field actions:
  - `addField(customId: string, field: Omit<Field, 'id'>)`
  - `updateField(customId: string, fieldId: string, updates: Partial<Field>)`
  - `deleteField(customId: string, fieldId: string)`
  - `reorderFields(customId: string, fieldIds: string[])`
- Generate unique IDs using `crypto.randomUUID()`
- Auto-update `updatedAt` timestamp on custom

**Acceptance Criteria**:
- ✅ Can add/update/delete fields
- ✅ Field reordering works
- ✅ Timestamps update correctly

---

### Ticket 3.2: Dependency Graph Builder
**Complexity**: Large
**Dependencies**: 3.1

**Tasks**:
- Create `/lib/engine/dependency-resolver.ts`
- Implement function `buildDependencyGraph(customs: Custom[])`
  - Returns adjacency list: `Map<customId, customId[]>`
- Detect circular dependencies using DFS
- Throw descriptive error if cycle found
- Support both `reference` and `api-fetch` field types

**Acceptance Criteria**:
- ✅ Graph built correctly from customs
- ✅ Circular dependencies detected
- ✅ Error thrown with cycle path
- ✅ Handles api-fetch dependencies

---

### Ticket 3.3: Topological Sort Implementation
**Complexity**: Medium
**Dependencies**: 3.2

**Tasks**:
- Create function `topologicalSort(graph: Map<string, string[]>)`
- Use Kahn's algorithm
- Return ordered list of custom IDs

**Acceptance Criteria**:
- ✅ Returns correct topological order
- ✅ Handles disconnected graphs
- ✅ Works with complex dependency chains

---

### Ticket 3.4: Data Generator (Faker Integration)
**Complexity**: Medium
**Dependencies**: 3.1

**Tasks**:
- Create `/lib/engine/data-generator.ts`
- Implement `generateFieldValue(field: Field)`:
  - `string` → `faker.lorem.word()`
  - `number` → `faker.number.int({ min: 1, max: 1000 })`
  - `boolean` → `faker.datatype.boolean()`
  - `array` → Generate array of 1-5 items
  - `object` → Empty object (user defines structure via nested fields)
  - `reference` → Return placeholder
  - `api-fetch` → Return placeholder (resolved later)
- Optional: seed for deterministic generation

**Acceptance Criteria**:
- ✅ Generates realistic dummy data
- ✅ All field types supported
- ✅ References and api-fetch return placeholders

---

### Ticket 3.5: API Data Fetcher
**Complexity**: Large
**Dependencies**: 2.3, 3.4

**Tasks**:
- Create `/lib/http/api-fetcher.ts`
- Implement `fetchFieldData(field: Field, category: Category): Promise<any>`
- Logic:
  1. Build full URL: `${getBaseUrl(category)}${field.apiEndpoint}`
  2. Add auth and default headers from category
  3. Perform GET request
  4. Parse response (JSON)
  5. Return data or throw error
- Implement retry logic (1 retry on failure)
- Cache responses in memory (TTL: 5 minutes)

**Example**:
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchFieldData(
  field: Field,
  category: Category
): Promise<any> {
  const cacheKey = `${category.id}-${field.apiEndpoint}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const baseUrl = getBaseUrl(category);
  const url = `${baseUrl}${field.apiEndpoint}`;

  const headers = buildRequestHeaders(
    { customHeaders: [], ...field } as Custom,
    category
  );

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('API fetch failed:', error);
    throw error;
  }
}
```

**Acceptance Criteria**:
- ✅ Fetches data from configured API endpoints
- ✅ Uses category's base URL and headers
- ✅ Caches responses with TTL
- ✅ Gracefully handles errors

---

### Ticket 3.6: Data Resolution Engine
**Complexity**: Large
**Dependencies**: 3.3, 3.4, 3.5

**Tasks**:
- Create `/lib/engine/data-resolver.ts`
- Implement `resolveData(customs: Custom[], category: Category): Promise<Map<string, any>>`
- Process customs in topological order
- For each custom:
  - Generate data for all fields
  - If field is `reference`, inject resolved data from dependency
  - If field is `api-fetch`, call `fetchFieldData()`
  - Store result in map
- Return map of `{ customId: generatedData }`

**Example**:
```typescript
export async function resolveData(
  customs: Custom[],
  category: Category
): Promise<Map<string, any>> {
  const graph = buildDependencyGraph(customs);
  const order = topologicalSort(graph);
  const resolvedData = new Map<string, any>();

  for (const customId of order) {
    const custom = customs.find(c => c.id === customId)!;
    const data: any = {};

    for (const field of custom.fields) {
      if (!field.isExported) continue;

      if (field.type === 'reference' && field.referenceId) {
        data[field.key] = resolvedData.get(field.referenceId);
      } else if (field.type === 'api-fetch' && field.apiEndpoint) {
        try {
          data[field.key] = await fetchFieldData(field, category);
        } catch (error) {
          data[field.key] = generateFieldValue({ ...field, type: 'string' });
        }
      } else {
        data[field.key] = generateFieldValue(field);
      }
    }

    resolvedData.set(customId, data);
  }

  return resolvedData;
}
```

**Acceptance Criteria**:
- ✅ Resolves all dependencies correctly
- ✅ References inject actual data
- ✅ API fetches work with environment config
- ✅ Falls back to dummy data on API errors
- ✅ Only exported fields included

---

## PHASE 4: HTTP TESTING & REQUEST EXECUTION

### Ticket 4.1: HTTP Client Implementation
**Complexity**: Large
**Dependencies**: 2.3, 3.6

**Tasks**:
- Create `/lib/http/http-client.ts`
- Implement `sendRequest(custom: Custom, category: Category): Promise<HttpResponse>`
- Logic:
  1. Resolve custom's data (use data resolver)
  2. Build full URL: `${getBaseUrl(category)}${custom.requestConfig.endpoint}`
  3. Replace path variables (e.g., `/users/{{userId}}`)
  4. Build headers (category + custom)
  5. Send request with fetch API
  6. Measure duration
  7. Parse response (JSON or text)
  8. Return `HttpResponse` object

**Example**:
```typescript
export async function sendRequest(
  custom: Custom,
  category: Category
): Promise<HttpResponse> {
  const startTime = Date.now();

  try {
    // Resolve data
    const resolvedData = await resolveData([custom], category);
    const data = resolvedData.get(custom.id);

    // Build URL
    const baseUrl = getBaseUrl(category);
    let endpoint = custom.requestConfig?.endpoint || '/';

    // Replace path variables: /users/{{userId}} → /users/123
    endpoint = endpoint.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });

    const url = `${baseUrl}${endpoint}`;
    const headers = buildRequestHeaders(custom, category);

    // Build request options
    const options: RequestInit = {
      method: custom.requestConfig?.method || 'GET',
      headers,
    };

    // Add body for non-GET requests
    if (options.method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    // Send request
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    // Parse response
    const contentType = response.headers.get('content-type');
    let body: any;

    if (contentType?.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    // Build response object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      duration,
    };
  } catch (error: any) {
    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: null,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}
```

**Acceptance Criteria**:
- ✅ Sends HTTP requests with correct method
- ✅ Uses category's environment and auth
- ✅ Replaces path variables correctly
- ✅ Includes resolved data as body
- ✅ Measures request duration
- ✅ Returns structured response object
- ✅ Handles errors gracefully

---

### Ticket 4.2: Request Configuration UI
**Complexity**: Medium
**Dependencies**: 4.1

**Tasks**:
- Add "Request" section to custom editor
- Fields:
  - HTTP method dropdown (GET, POST, PUT, PATCH, DELETE)
  - Endpoint input (e.g., `/users/{{userId}}`)
  - Path variable highlighting (show which fields will be used)
  - Body source selector (if non-GET)
- Visual feedback for variable replacement

**Acceptance Criteria**:
- ✅ Can configure HTTP method and endpoint
- ✅ Path variables highlighted in UI
- ✅ Shows which custom fields will be used
- ✅ Saves to `requestConfig` in custom

---

### Ticket 4.3: Response Viewer Component
**Complexity**: Large
**Dependencies**: 4.1

**Tasks**:
- Create `/components/http/response-viewer.tsx`
- Tabs:
  1. **Body**: Formatted JSON or text
  2. **Headers**: Key-value list
  3. **Info**: Status, duration, size
- Color-coded status (200-299: green, 400-499: yellow, 500+: red)
- Copy response body button
- Save response to file button
- Loading state during request

**Example UI**:
```
┌─────────────────────────────────────┐
│ Response [200 OK] (234ms)           │
├─────────────────────────────────────┤
│ [Body] [Headers] [Info]             │
├─────────────────────────────────────┤
│ {                                   │
│   "id": 123,                        │
│   "name": "John Doe",               │
│   "email": "john@example.com"       │
│ }                                   │
│                                     │
│ [Copy] [Save]                       │
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
- ✅ Displays response body (formatted)
- ✅ Shows response headers
- ✅ Displays status, duration, size
- ✅ Color-coded status indicators
- ✅ Copy and save functionality
- ✅ Loading state

---

### Ticket 4.4: "Send Request" Button & Flow
**Complexity**: Medium
**Dependencies**: 4.2, 4.3

**Tasks**:
- Add "Send" button in custom editor (when requestConfig exists)
- Click triggers `sendRequest()`
- Show loading spinner during request
- Display response in response viewer panel
- Store last response in custom state (optional)
- Keyboard shortcut: `Ctrl+Enter`

**Acceptance Criteria**:
- ✅ Send button triggers HTTP request
- ✅ Loading state shown during request
- ✅ Response displayed in viewer
- ✅ Errors shown in viewer
- ✅ Keyboard shortcut works

---

## PHASE 5: UI & INTERACTION

### Ticket 5.1: Custom Editor Component
**Complexity**: Large
**Dependencies**: 3.1, 4.2

**Tasks**:
- Create `/components/custom/custom-editor.tsx`
- Two main sections:
  1. **Request Configuration** (if applicable)
     - HTTP method, endpoint
  2. **Fields**
     - List of fields with:
       - Key name (editable inline)
       - Type selector (dropdown)
       - Value input (type-specific)
       - Reference/API endpoint selector
       - Export checkbox
       - Delete button
- "Add Field" button
- Auto-save on changes (debounced 500ms)

**Acceptance Criteria**:
- ✅ Can add/edit/delete fields
- ✅ Inline editing works
- ✅ Type changes update UI
- ✅ Reference selector integrated
- ✅ Request config section works

---

### Ticket 5.2: Reference Selector Component
**Complexity**: Medium
**Dependencies**: 5.1

**Tasks**:
- Create `/components/custom/reference-selector.tsx`
- Dropdown showing all customs in current **category**
- Can optionally show customs from other categories (advanced)
- Search/filter functionality
- Visual indicator if reference creates cycle

**Acceptance Criteria**:
- ✅ Lists customs in category
- ✅ Search works
- ✅ Shows cycle warning
- ✅ Grouped by category (if cross-category enabled)

---

### Ticket 5.3: API Endpoint Selector Component
**Complexity**: Medium
**Dependencies**: 5.1

**Tasks**:
- Create `/components/custom/api-endpoint-selector.tsx`
- Input field for endpoint path
- Shows resolved URL preview: `{baseUrl}{endpoint}`
- Test button to fetch data preview
- Response preview (first 100 chars)

**Example UI**:
```
┌─────────────────────────────────────┐
│ API Endpoint                        │
│ /users/1                            │
│                                     │
│ Full URL:                           │
│ https://staging.api.com/users/1     │
│                                     │
│ [Test Fetch]                        │
│                                     │
│ Preview: { "id": 1, "name": "..." } │
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
- ✅ Shows full resolved URL
- ✅ Test button fetches data
- ✅ Preview displays response
- ✅ Errors shown gracefully

---

### Ticket 5.4: Drag-and-Drop Field Reordering
**Complexity**: Medium
**Dependencies**: 5.1

**Tasks**:
- Install and configure `dnd-kit`
- Make field list draggable
- Update field order in store on drop
- Visual feedback during drag

**Acceptance Criteria**:
- ✅ Can drag fields to reorder
- ✅ Visual feedback during drag
- ✅ Order persists in store

---

### Ticket 5.5: Data Preview Panel
**Complexity**: Large
**Dependencies**: 3.6, 5.1

**Tasks**:
- Create `/components/custom/data-preview.tsx`
- Show resolved data for active custom
- Display as formatted JSON
- Refresh button to regenerate data
- "Use as Request Body" button (if requestConfig exists)
- Copy to clipboard button
- Loading state during resolution

**Acceptance Criteria**:
- ✅ Shows resolved data in real-time
- ✅ Data updates when fields change
- ✅ Refresh works
- ✅ Copy to clipboard works
- ✅ Handles errors (cycles, API failures)

---

### Ticket 5.6: Category Management UI
**Complexity**: Medium
**Dependencies**: 1.3, 2.1

**Tasks**:
- Create modals for:
  - Create category
  - Rename category
  - Delete confirmation
- Use Radix UI Dialog component
- Form validation (name required, no duplicates within project)

**Acceptance Criteria**:
- ✅ All modals work correctly
- ✅ Form validation works
- ✅ Changes persist in store
- ✅ Confirmation required for delete

---

### Ticket 5.7: Workspace/Project Management UI
**Complexity**: Small
**Dependencies**: 1.3

**Tasks**:
- Create modals for:
  - Create workspace
  - Create project
  - Rename workspace/project
  - Delete confirmation
- Use Radix UI Dialog component
- Form validation

**Acceptance Criteria**:
- ✅ All modals work correctly
- ✅ Form validation works
- ✅ Changes persist in store

---

## PHASE 6: EXPORT & INTEGRATION

### Ticket 6.1: JSON Exporter
**Complexity**: Small
**Dependencies**: 3.6

**Tasks**:
- Create `/lib/exporters/json-exporter.ts`
- Implement `exportToJSON(data: any): string`
- Use `JSON.stringify(data, null, 2)`

**Acceptance Criteria**:
- ✅ Exports valid JSON
- ✅ Properly formatted

---

### Ticket 6.2: XML Exporter
**Complexity**: Medium
**Dependencies**: 6.1

**Tasks**:
- Create `/lib/exporters/xml-exporter.ts`
- Use `xmlbuilder2` library
- Implement `exportToXML(data: any, rootTag?: string): string`
- Handle nested objects and arrays

**Acceptance Criteria**:
- ✅ Exports valid XML
- ✅ Handles nested structures
- ✅ Arrays converted properly

---

### Ticket 6.3: Form-Data Exporter
**Complexity**: Medium
**Dependencies**: 6.1

**Tasks**:
- Create `/lib/exporters/form-data-exporter.ts`
- Flatten nested objects (e.g., `user.name` → `user[name]`)
- Format as multipart/form-data string

**Acceptance Criteria**:
- ✅ Exports valid form-data format
- ✅ Flattens nested objects correctly

---

### Ticket 6.4: URL-Encoded Exporter
**Complexity**: Small
**Dependencies**: 6.1

**Tasks**:
- Create `/lib/exporters/url-encoded-exporter.ts`
- Use `URLSearchParams` API
- Flatten nested objects

**Acceptance Criteria**:
- ✅ Exports valid URL-encoded string
- ✅ Properly encodes special characters

---

### Ticket 6.5: Export UI Component
**Complexity**: Medium
**Dependencies**: 6.1-6.4, 5.5

**Tasks**:
- Create `/components/export/export-panel.tsx`
- Format selector (radio buttons)
- Export button
- Copy to clipboard functionality
- Download as file functionality
- Preview exported data

**Acceptance Criteria**:
- ✅ All export formats work
- ✅ Copy to clipboard works
- ✅ File download works
- ✅ Preview shows formatted output

---

### Ticket 6.6: CLI Endpoint Setup
**Complexity**: Medium
**Dependencies**: 1.2

**Tasks**:
- Create `/app/api/workspace/[name]/route.ts`
- Implement GET endpoint to fetch workspace by name
- Return workspace JSON
- Add CORS headers

**Acceptance Criteria**:
- ✅ Endpoint returns workspace data
- ✅ 404 if workspace not found
- ✅ CORS configured

---

## PHASE 7: POLISH & ENHANCEMENT

### Ticket 7.1: IndexedDB Persistence
**Complexity**: Large
**Dependencies**: 1.2

**Tasks**:
- Create `/lib/storage/indexeddb.ts`
- Use `idb` library
- Implement:
  - `saveWorkspace(workspace: Workspace)`
  - `loadWorkspaces(): Promise<Workspace[]>`
  - `deleteWorkspace(id: string)`
- Auto-save on state changes (debounced 1s)
- Load workspaces on app init
- Migration system for schema changes

**Acceptance Criteria**:
- ✅ Data persists across sessions
- ✅ Auto-save works without blocking
- ✅ Delete removes from IndexedDB
- ✅ Loads on app start

---

### Ticket 7.2: Error Handling & Validation
**Complexity**: Large
**Dependencies**: All previous

**Tasks**:
- Add error boundaries in React components
- Validation:
  - No duplicate field names within custom
  - No self-references
  - Valid URLs in environment configs
  - Valid auth credentials format
- Toast notifications (use `sonner`)
- Error messages for:
  - Circular dependencies
  - API fetch failures
  - Invalid configurations

**Acceptance Criteria**:
- ✅ Duplicate field names prevented
- ✅ Self-references blocked
- ✅ Circular dependencies show clear error
- ✅ Toast notifications work
- ✅ All validations in place

---

### Ticket 7.3: Search & Filter
**Complexity**: Medium
**Dependencies**: 1.3

**Tasks**:
- Add search bar in sidebar
- Filter customs by name
- Highlight search matches
- Search across categories

**Acceptance Criteria**:
- ✅ Search filters in real-time
- ✅ Case-insensitive matching
- ✅ Clear search button

---

### Ticket 7.4: Keyboard Shortcuts
**Complexity**: Small
**Dependencies**: 5.1, 4.4

**Tasks**:
- Implement shortcuts:
  - `Ctrl+N`: New custom
  - `Ctrl+S`: Save (trigger manual save)
  - `Ctrl+D`: Delete active custom
  - `Ctrl+E`: Open export panel
  - `Ctrl+Enter`: Send request
- Show shortcuts in tooltips

**Acceptance Criteria**:
- ✅ All shortcuts work
- ✅ Tooltips show shortcuts

---

### Ticket 7.5: Dark Mode Support
**Complexity**: Small
**Dependencies**: 1.3

**Tasks**:
- Add Tailwind dark mode configuration
- Create theme toggle button
- Persist theme in localStorage
- Ensure all components support dark mode

**Acceptance Criteria**:
- ✅ Dark mode toggle works
- ✅ Theme persists
- ✅ All UI components support dark mode

---

### Ticket 7.6: Documentation & Examples
**Complexity**: Medium
**Dependencies**: None

**Tasks**:
- Create `README.md`
- Create example workspace with:
  - Sample category (e.g., "User API")
  - Environment configs (local + staging)
  - Auth setup example
  - Sample customs with references
- Add inline code comments
- Create usage guide

**Acceptance Criteria**:
- ✅ README complete
- ✅ Example workspace seeds on first visit
- ✅ Code comments added

---

## Optional Future Enhancements

### 🚀 Advanced Features (Post-MVP)

- **Template Library**: Pre-built categories for common APIs
- **Import from OpenAPI/Swagger**: Auto-generate customs from specs
- **Request History**: Save past responses
- **Collections**: Group related requests
- **Pre-request Scripts**: Run JS before sending request
- **Response Assertions**: Automated testing
- **Mock Server**: Create mock endpoints
- **Team Collaboration**: Share workspaces
- **GraphQL Support**: Query builder for GraphQL APIs
- **WebSocket Testing**: Real-time connection testing
- **CLI Tool**: Standalone CLI for CI/CD integration

---

## Suggested Work Order

### Week 1: Foundation
- Tickets 0.1, 1.1, 1.2, 1.3 (Enhanced setup + categories)

### Week 2: Categories & Config
- Tickets 2.1 → 2.3 (Category management, environments, auth)

### Week 3: Data Engine
- Tickets 3.1 → 3.6 (Dependency resolution, data generation, API fetching)

### Week 4: HTTP Testing
- Tickets 4.1 → 4.4 (Request execution, response viewing)

### Week 5: UI Development
- Tickets 5.1 → 5.7 (Editors, previews, management)

### Week 6: Export & Polish
- Tickets 6.1 → 6.5 (Export functionality)
- Tickets 7.1 → 7.3 (Persistence, errors, search)

### Week 7: Refinement
- Tickets 7.4 → 7.6 (Shortcuts, dark mode, docs)
- Testing and bug fixes

---

## Testing Strategy

For each ticket:
1. **Unit tests** for engine/http logic
2. **Integration tests** for store actions
3. **Manual testing** for UI components
4. **Cross-browser testing**

---

## Success Metrics

- ✅ Can create workspace → project → category → custom hierarchy
- ✅ Can configure environments (local/staging/prod)
- ✅ Can set up auth and headers at category level
- ✅ Can define fields with references and API fetches
- ✅ Dependency resolution works
- ✅ Can send HTTP requests and view responses (like Insomnia)
- ✅ Data generation produces realistic output
- ✅ Export to all 4 formats works
- ✅ Data persists across sessions

---

## Notes

- **Categories are first-class citizens** - they enable environment management and shared config
- **HTTP testing is core** - treat it like Insomnia's request sender
- **Environment switching must be seamless** - one-click between local/staging/prod
- **Auth cascades** - set once at category level, applies to all customs
- Prioritize **developer experience** - make it feel natural to switch environments and test APIs

---

**Happy Building! 🚀**
