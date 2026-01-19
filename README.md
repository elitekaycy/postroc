# PostRoc

A composable API data & request orchestration platform that helps developers construct valid, dependency-aware request payloads.

## Problem

Modern backend systems rely on relational and interdependent data. While tools like Postman and Insomnia excel at executing HTTP requests, they fall short in assisting developers with constructing valid, dependency-aware request data.

## Solution

PostRoc enables developers to:
- Build reusable, composable data units (Customs)
- Reference other Customs to create dependency chains
- Manage multiple environments (local, staging, production)
- Configure authentication and headers at the category level
- Resolve dependencies automatically via topological sorting
- Generate realistic dummy data with Faker.js
- Fetch real API data to populate fields
- Test HTTP requests directly in the browser
- Export to multiple formats (JSON, XML, form-data, URL-encoded)
- Configure export transformations (full object, single field, array extraction, custom code)

## Features

### Data Composition
- **Fields**: Define data fields with types (string, number, boolean, array, object, reference)
- **References**: Link Customs together - resolved data flows through the dependency graph
- **Nested Fields**: Support for complex nested object structures
- **Export Config**: Control how each Custom exports its data when referenced

### Request Testing
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Environment Switching**: Instantly switch between local, staging, production
- **Auth Support**: Bearer token, API key, Basic auth
- **Custom Headers**: Per-category and per-request headers
- **Fetch to Populate**: Load API response data directly into fields

### Data Preview
- **Live Resolution**: Preview shows resolved data with all references expanded
- **Syntax Highlighting**: JSON, XML, and code highlighting
- **Multiple Formats**: Export as JSON, XML, form-data, or URL-encoded

## Architecture

```
Workspace
  └── Project
      ├── Customs (project-level)
      └── Category
          ├── Environment Config (local, staging, production)
          ├── Auth Settings (Bearer, API Key, Basic)
          ├── Default Headers
          └── Customs (category-level)
              └── Fields (with nested support)
```

## Tech Stack

- Next.js 16+ (App Router, Turbopack)
- TypeScript (Strict Mode)
- Zustand with Immer (State Management)
- Tailwind CSS 4 (Styling)
- dnd-kit (Drag and Drop)
- Faker.js (Data Generation)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Roadmap

See [docs/PERSISTENCE_PLAN.md](./docs/PERSISTENCE_PLAN.md) for the workspace persistence and export/import feature plan.

## License

MIT
