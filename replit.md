# LogicLens — TraceWise AI

## Overview

LogicLens is a full-stack educational platform for beginner Java programmers. It uses the TraceWise AI client-side simulation engine to step through Java programs visually with React Flow, explaining each execution step in plain English.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (`artifacts/logiclens`), dark indigo theme, shadcn/ui, React Flow
- **API framework**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **Auth**: JWT (student + admin roles), stored in localStorage, injected via `setAuthTokenGetter`
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec`)
- **Build**: esbuild (CJS bundle)

## Key Packages

| Package | Path | Purpose |
|---|---|---|
| `@workspace/logiclens` | `artifacts/logiclens` | React+Vite frontend |
| `@workspace/api-server` | `artifacts/api-server` | Express API server |
| `@workspace/db` | `lib/db` | Drizzle schema + migrations |
| `@workspace/api-spec` | `lib/api-spec` | OpenAPI spec + codegen |
| `@workspace/api-zod` | `lib/api-zod` | Generated Zod schemas |
| `@workspace/api-client-react` | `lib/api-client-react` | Generated React Query hooks |

## Features

- **TraceWise AI Engine** — client-side Java simulation engine (no server execution)
  - `simulationEngine.ts` — runs Java programs step by step
  - `detectCategory.ts` — categorizes program type
  - `buildFlowNodes.ts` / `buildFlowEdges.ts` — React Flow graph generation
  - `explainStep.ts` — generates plain-English explanations for each step
- **30+ Java programs** in 5 categories (Basic I/O & Math, Conditionals, Loops, Number Logic, Pattern Programs)
- **Workspace Page** — code viewer with line highlighting, step controls, variable tracker, output panel, save/favorite
- **Saved Traces** — persist execution traces to PostgreSQL via API
- **Favorites** — bookmark programs for quick access
- **Auth** — JWT login/signup, student/admin roles
- **Admin Panel** — program library management, platform stats
- **Dashboard** — personalized landing page with category cards and recent activity

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Demo Credentials

- Student: `student@logiclens.dev` / `student123`
- Admin: `admin@logiclens.dev` / `admin123`

## Important Notes

- `lib/api-zod/src/index.ts` must only contain `export * from "./generated/api"` — do NOT add other exports
- `lib/api-client-react/src/index.ts` exports `setAuthTokenGetter` directly — import from `@workspace/api-client-react` (not a subpath)
- API types: `SavedTrace` = `{id, userId, title, category, subtype, code, customInputs, traceSummary, finalOutput, savedAt}`. `FavoriteProgram` = `{id, userId, programId, programName, programCategory, addedAt}`
- `useDeleteTrace` / `useRemoveFavorite` / `useAdminDeleteProgram` all take `{ id: number }`
- `useAddFavorite` takes `{ data: AddFavoriteBody }` where `AddFavoriteBody = { programId, programName, programCategory }`
- `useCreateTrace` takes `{ data: CreateTraceBody }` — no `useSaveTrace` hook exists
- No `useAdminGetUsers` hook — admin panel uses `useAdminGetPrograms` + `useAdminGetStats` only
- All programs use dark indigo CSS theme — `.dark` class applied in AppLayout

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
