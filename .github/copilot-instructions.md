# ReUseIt Copilot Instructions

For full project rules, workflows, and architecture, see `agents.md`.

## Purpose

These instructions define strict rules for GitHub Copilot during code generation.
Copilot must follow established patterns, avoid hallucination, and write code consistent with the monorepo.

## Core Rules

- Never invent files, folders, modules, APIs, types, or schema fields.
- Always follow existing patterns in the repo.
- Prefer modifying existing modules over creating new ones.
- Backend-first workflow: Prisma schema → resolver → tests → frontend.

## TypeScript

- Strict mode required.
- Never use `any`.
- Explicit types for all variables, params, returns.
- Use generated GraphQL types when available.

## Styling

- Use NativeWind only (no web utilities like `space-x`, `space-y`, `gap-*`, etc.).
- Mobile-first, native components only.
- Follow the project's existing design tokens and patterns.
- Focus on theme, layout, and interaction _flow_ — visual rhythm, spacing, hierarchy, and purposeful micro-interactions.
- Do **not** prescribe component-level implementations here; components are already designed in `apps/mobile/src/components/`.
- When suggesting style changes, reference `docs/STYLE_GUIDELINES_TAILWIND.md` for tokens and layout principles.
- Always follow `docs/style_guideline.md` for high-level look & feel and component behavior; do NOT generate generic or default-styled components.

## Text / Localization

- All user-facing text must come from `i18n.ts`.
- Create or update translation keys for new text.
- Never hardcode UI strings.

## React Native (Expo)

- Functional components only.
- Navigation: Expo Router.
- State:
  - Apollo Client for server state
  - Zustand for UI/global state
- Use existing hooks/components before creating new ones.

## Backend (NestJS + GraphQL)

- Use the module structure: `module/` → `service.ts`, `resolver.ts`, `*.spec.ts`.
- Follow existing naming, decorator usage, and resolver patterns.
- Prisma:
  - Schema changes require db push via `pnpm -F backend run prisma:db:push`
  - Never add fields not defined in Prisma
- After backend changes: update GraphQL types via codegen.

## File Operations

- Always verify file/folder existence before referencing.
- Use absolute paths when modifying files.
- Read the file before making edits.

## Database

- MongoDB with Prisma.
- Follow existing geospatial index patterns.

## ML Folder

- Do not modify ML Python scripts unless the code is inside `apps/ml-training/`.
- Assume TensorFlow Lite is used for on-device inference only.

## Security

- Use JWT auth patterns already present.
- Never hardcode secrets or tokens.

## Testing

- Backend modules require unit tests.
- GraphQL resolvers must include integration or e2e tests.
- Maintain existing test structures.
