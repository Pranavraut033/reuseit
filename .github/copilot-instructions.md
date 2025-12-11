# ReUseIt AI Agent Instructions

## Project Overview

ReUseIt is a gamified recycling app using AI for waste identification. Monorepo with React Native (Expo) mobile app, NestJS GraphQL backend, Python ML training, and MongoDB database.

## Architecture

- **Mobile**: React Native (Expo) + NativeWind styling + Apollo Client
- **Backend**: NestJS + GraphQL + Prisma ORM + MongoDB
- **ML**: Python training pipeline + TensorFlow Lite models + Ollama LLM
- **Deployment**: Docker Compose with services

Key directories: `apps/backend/`, `apps/mobile/`, `apps/ml-training/`, `types/`

## Tech Stack Conventions

- **TypeScript**: Strict mode, no `any` types
- **Styling**: NativeWind only (no web classes like `space-x`, `space-y`)
- **State**: Apollo Client for server state, Zustand for global UI
- **Text**: Use `i18n.ts` for all user-facing text, create/update translation keys
- **Database**: Prisma migrations for schema changes

## Development Workflows

- **Backend Dev**: `pnpm --filter backend run start:dev` (fast local)
- **Mobile Dev**: `pnpm --filter mobile run start`
- **Production**: `docker-compose --profile production up backend`
- **Schema Changes**: Update `apps/backend/prisma/schema.prisma`, run `pnpm prisma:generate && pnpm prisma:migrate:dev`
- **GraphQL**: After backend changes, run `pnpm codegen` for mobile types
- **ML Scripts**: `cd apps/ml-training && source .venv/bin/activate && python <script.py>`
- **Testing**: Backend `pnpm --filter backend test`, Mobile `pnpm --filter mobile test`

## Key Patterns

- **Backend First**: Schema → Resolver → Tests, then implement mobile
- **Modules**: NestJS modules in `apps/backend/src/[module]/` with `.service.ts`, `.resolver.ts`, `.spec.ts`
- **Mobile Screens**: Expo Router in `apps/mobile/src/app/`, components in `src/components/`
- **GraphQL**: Queries in `apps/mobile/src/gql/`, fragments for DRY
- **Gamification**: Points/badges in `point` module, awarded for actions like posts/events
- **Events**: Full CRUD with participants, linked to posts/locations

## Integration Points

- **Auth**: JWT + Firebase OAuth, secure storage with expo-secure-store
- **Maps**: Google Maps for locations/recycling points
- **ML**: On-device TensorFlow Lite for waste classification
- **LLM**: Ollama for AI analysis, FastAPI wrapper
- **Caching**: Redis for sessions/queries

## Critical Rules

- **ALWAYS** check/update `PROJECT_STATUS.md` before/after tasks
- **NEVER** create new architecture without existing patterns
- **VERIFY** file existence before operations
- **TEST** changes immediately
- **PREFER** modifying existing modules over new ones

Reference: `agents.md`, `docs/03-architecture.md`, `PROJECT_STATUS.md`</content>
<parameter name="filePath">/Users/pranavraut/Documents/Workspace/reuseit-mono/.github/copilot-instructions.md
