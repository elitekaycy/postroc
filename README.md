# PostRoc

A composable API data & request orchestration platform that helps developers construct valid, dependency-aware request payloads.

## Problem

Modern backend systems rely on relational and interdependent data. While tools like Postman and Insomnia excel at executing HTTP requests, they fall short in assisting developers with constructing valid, dependency-aware request data.

## Solution

PostRoc enables developers to:
- Build reusable, composable data units (Customs)
- Manage multiple environments (local, staging, production)
- Configure authentication and headers at the category level
- Resolve dependencies automatically via topological sorting
- Generate realistic dummy data or fetch real data from APIs
- Test HTTP requests directly in the browser (Insomnia-style)
- Export to multiple formats (JSON, XML, form-data, URL-encoded)

## Architecture

```
Workspace
  └── Project
      └── Category
          ├── Environment Config (local, staging, production)
          ├── Auth Settings (Bearer, API Key, Basic)
          ├── Default Headers
          └── Customs
              └── Fields
```

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript (Strict Mode)
- Zustand (State Management)
- Radix UI + Tailwind CSS (UI Components)
- Faker.js (Data Generation)
- IndexedDB (Persistence)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed implementation roadmap.

## License

MIT
