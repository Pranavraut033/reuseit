# Style Guide (for Copilot Agent)

## Core Development Rules

- **Never invent** files, folders, modules, APIs, types, or schema fields
- **Always follow** existing patterns in the repo
- **Prefer modifying** existing modules over creating new ones
- **Backend-first workflow**: Prisma schema → resolver → tests → frontend

## TypeScript

- Strict mode required
- Never use `any`
- Explicit types for all variables, parameters, returns
- Use generated GraphQL types when available

## Styling (React Native)

- Use NativeWind only (no web utilities like `space-x`, `space-y`, `gap-*`)
- Mobile-first, native components only
- Follow existing design tokens and patterns
- Reference `docs/STYLE_GUIDELINES_TAILWIND.md` for tokens
- Always follow `docs/style_guideline.md` for look & feel

## Text / Localization

- All user-facing text must come from `i18n.ts`
- Create or update translation keys for new text
- Never hardcode UI strings

## React Native (Expo)

- Functional components only
- Navigation: Expo Router
- State: Apollo Client (server), Zustand (UI/global)
- Use existing hooks/components before creating new ones

## Backend (NestJS + GraphQL)

- Module structure: `module/` → `service.ts`, `resolver.ts`, `*.spec.ts`
- Follow existing naming, decorators, and resolver patterns
- Prisma: Schema changes require `pnpm -F backend run prisma:db:push`
- Never add fields not defined in Prisma
- After backend changes: update GraphQL types via codegen

## File Operations

- Always verify file/folder existence before referencing
- Use absolute paths when modifying files
- Read the file before making edits

## Database

- MongoDB with Prisma
- Follow existing geospatial index patterns

## ML

- Do not modify ML Python scripts unless inside `apps/ml-training/`
- TensorFlow Lite for on-device inference only

## Security

- Use JWT auth patterns already present
- Never hardcode secrets or tokens

## Testing

- Backend modules require unit tests
- GraphQL resolvers must include integration or e2e tests
- Maintain existing test structures

---

**Last Updated**: December 2025
