# PostRoc CLI Tool Plan

## Overview
A command-line interface tool for generating mock data from PostRoc configurations. The CLI is **fully client-focused** - it works with exported workspace files from the web app and stores data locally. No server-side database required.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEB APP (Browser)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    localStorage                          │   │
│  │  - workspaces, projects, categories, customs            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                    [Export Button]                              │
│                           ↓                                     │
│                    workspace.json                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                      [Download/Copy]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Tool                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              ~/.config/postroc/data/                     │   │
│  │  - imported workspaces stored as JSON files             │   │
│  │  - workspace-abc.json, workspace-xyz.json               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                   [Generate Command]                            │
│                           ↓                                     │
│              Generated JSON → clipboard/file/stdout             │
└─────────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. Import from Web App
```bash
# Import an exported workspace file into CLI local storage
postroc import ./workspace-export.json

# Import and set as active workspace
postroc import ./workspace-export.json --activate

# Import from URL (e.g., shared workspace link)
postroc import https://example.com/shared/workspace.json

# List imported workspaces
postroc list workspaces
```

### 2. Data Generation
```bash
# Generate data for a specific custom by ID or name
postroc generate custom-12sdf
postroc generate "User Profile"

# Generate using a file directly (without importing)
postroc generate custom-12sdf --file ./workspace.json

# Generate data for all customs in a workspace
postroc generate --workspace workspace-abc123

# Generate data for all customs in a project
postroc generate --project project-xyz

# Generate data for all customs in a category
postroc generate --category category-456
```

### 3. Output Options
```bash
# Copy to clipboard (default)
postroc generate custom-12sdf --copy

# Output to stdout
postroc generate custom-12sdf --stdout

# Save to file
postroc generate custom-12sdf --output ./data.json

# Pretty print
postroc generate custom-12sdf --pretty

# Generate multiple items (for arrays)
postroc generate custom-12sdf --count 10
```

### 4. Configuration
```bash
# Set default workspace to use
postroc config set workspace workspace-abc123

# View current configuration
postroc config list

# Set default output mode
postroc config set output clipboard  # or stdout, file

# Set pretty print default
postroc config set pretty true
```

### 5. Workspace Management
```bash
# List all imported workspaces
postroc list workspaces

# List all projects in a workspace
postroc list projects --workspace workspace-abc

# List all customs
postroc list customs
postroc list customs --workspace workspace-abc
postroc list customs --project project-xyz
postroc list customs --category category-456

# Search customs by name/tag
postroc search "user"

# Remove an imported workspace
postroc remove workspace-abc123
```

### 6. Export from CLI
```bash
# Export a workspace back to file (after modifications)
postroc export workspace-abc --output ./backup.json
```

## Architecture

### Technology Stack
- **Language**: TypeScript/Node.js (for code sharing with web app)
- **CLI Framework**: Commander.js
- **Clipboard**: clipboardy
- **Config Storage**: conf (stores in ~/.config/postroc/)
- **Data Storage**: Local JSON files (no database required)

### Project Structure
```
postroc-cli/
├── src/
│   ├── commands/
│   │   ├── generate.ts      # Data generation command
│   │   ├── config.ts        # Configuration management
│   │   ├── list.ts          # List resources
│   │   ├── search.ts        # Search customs
│   │   ├── import.ts        # Import workspace from file
│   │   ├── export.ts        # Export workspace to file
│   │   └── remove.ts        # Remove imported workspace
│   ├── lib/
│   │   ├── storage.ts       # Local file storage management
│   │   ├── generator.ts     # Data generation logic (copied from web)
│   │   ├── config.ts        # Config file management
│   │   └── clipboard.ts     # Clipboard utilities
│   ├── types/
│   │   └── index.ts         # TypeScript types (shared with web)
│   └── index.ts             # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Local Storage Structure
```
~/.config/postroc/
├── config.json              # CLI configuration
└── data/
    ├── workspace-abc123.json
    ├── workspace-xyz789.json
    └── ...
```

## Web App Export Feature

The web app needs a robust export feature:

### Export Button in UI
- Export entire workspace as JSON
- Export single project
- Export single category
- Download as file or copy to clipboard

### Export Format
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "type": "workspace",
  "data": {
    "workspace": { "id": "workspace-abc", "name": "My API" },
    "projects": [...],
    "categories": [...],
    "customs": [...]
  }
}
```

## Implementation Phases

### Phase 1: Core Generation (MVP)
1. Basic CLI setup with Commander.js
2. `import` command to load workspace JSON files
3. `generate` command with custom ID
4. `list` command for workspaces and customs
5. Clipboard output
6. Local file storage

### Phase 2: Enhanced Features
1. `search` command
2. File output options
3. Multiple item generation (--count)
4. Pretty printing
5. `--file` flag for direct file usage

### Phase 3: Configuration
1. `config` command
2. Default workspace setting
3. Output preferences

### Phase 4: Advanced
1. Watch mode (regenerate on file change)
2. Shell completions
3. Workspace sync via file watchers

## Example Usage Flow

```bash
# First time setup
$ npm install -g postroc-cli

# Export workspace from web app, then import
$ postroc import ./my-workspace-export.json
✓ Imported workspace "My API Mocks" (workspace-abc123)

# List available customs
$ postroc list customs
┌──────────────────┬─────────────────┬──────────────┐
│ ID               │ Name            │ Project      │
├──────────────────┼─────────────────┼──────────────┤
│ custom-12sdf     │ User Profile    │ API Mocks    │
│ custom-34ghj     │ Product         │ API Mocks    │
│ custom-56klm     │ Order           │ E-commerce   │
└──────────────────┴─────────────────┴──────────────┘

# Generate data (copies to clipboard)
$ postroc generate custom-12sdf
✓ Generated data for "User Profile" - copied to clipboard

# Generate and save to file
$ postroc generate custom-12sdf --output ./user.json --pretty
✓ Generated data saved to ./user.json

# Generate multiple items
$ postroc generate custom-12sdf --count 5 --output ./users.json
✓ Generated 5 items saved to ./users.json

# Generate directly from file (without importing)
$ postroc generate custom-12sdf --file ./workspace.json --stdout
{"name": "John Doe", "email": "john@example.com", ...}
```

## Shared Code Strategy

To share code between the web app and CLI:

1. **Copy shared modules** from web app:
   - `lib/types/core.ts` → types for workspace, project, category, custom, field
   - `lib/engine/data-generator.ts` → data generation logic

2. **Maintain separately** (recommended for simplicity):
   - Copy the type definitions and generator code to CLI project
   - Update as needed when web app changes

3. **Or create monorepo** (optional, for larger teams):
   - Extract shared code to `packages/core`
   - Both web app and CLI import from shared package

## Config File Location

```
~/.config/postroc/config.json
{
  "activeWorkspace": "workspace-abc123",
  "defaultOutput": "clipboard",
  "prettyPrint": true
}
```

## Error Handling

```bash
# Custom not found
$ postroc generate invalid-id
✗ Error: Custom "invalid-id" not found in any imported workspace

# No workspaces imported
$ postroc list customs
ℹ No workspaces imported. Export from the web app and run:
  postroc import ./workspace-export.json

# File not found
$ postroc generate custom-12sdf --file ./missing.json
✗ Error: File not found: ./missing.json

# Invalid export file
$ postroc import ./invalid.json
✗ Error: Invalid workspace export file. Expected PostRoc export format.
```

## Keeping Data in Sync

Since the CLI works with exported files, here's the recommended workflow:

1. **Initial Setup**: Export workspace from web app, import into CLI
2. **After Changes**: Re-export from web app, re-import into CLI (overwrites existing)
3. **Team Sharing**: Commit workspace exports to git, team members import from repo

```bash
# Update workflow
$ postroc import ./workspace-export.json --force
✓ Updated workspace "My API Mocks" (workspace-abc123)
```

## Why File-Based?

This approach was chosen because:
- **No server required**: Web app uses localStorage, CLI uses local files
- **Works offline**: Generate data without network connection
- **Privacy**: Data stays on your machine
- **Simplicity**: No authentication, no API keys, no database
- **Portability**: Share workspace files via git, email, or any file transfer
