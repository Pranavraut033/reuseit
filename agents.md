# Agent Instructions for ReUseIt Project

## Overview

This document provides instructions for AI coding assistants (GitHub Copilot, etc.) working on the ReUseIt mobile application. Always refer to [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for current progress and update it whenever completing tasks.

---

## Project Context

**ReUseIt** is a cross-platform mobile application that incentivizes recycling through gamification, education, and AI-powered object identification.

**Architecture:**
- **Frontend:** React Native (Expo) - iOS/Android mobile app
- **Backend:** NestJS with GraphQL (Apollo Server)
- **Database:** MongoDB Atlas (managed via Prisma ORM)
- **ML:** TensorFlow Lite for on-device waste classification
- **Infrastructure:** Railway (backend), Firebase (auth/notifications), Google Maps API

**Monorepo Structure:**
```
apps/backend/    - NestJS API server
apps/mobile/     - Expo mobile application
docs/            - Comprehensive documentation
scripts/         - Utility scripts
```

---

## Core Principles

### 1. Always Check Project Status First
Before starting any work, read [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) to understand:
- Current sprint and priorities
- Completed features
- Known issues and technical debt
- Next tasks in the roadmap

### 2. Update Status After Completing Tasks
Whenever you complete a task:
1. Mark it as ✅ Done in `PROJECT_STATUS.md`
2. Update the "Last Updated" timestamp
3. Add any new issues discovered to the "Known Issues" section
4. Move the next priority task to "In Progress"

### 3. Follow Established Patterns
- **Backend:** Use NestJS decorators, DTOs, and GraphQL resolvers
- **Frontend:** Use functional components with hooks, TypeScript types from codegen
- **State:** Zustand for global state, React Query for server state
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Validation:** Yup schemas on frontend, class-validator on backend

### 4. Maintain Type Safety
- Never use `any` type
- Generate GraphQL types: `cd apps/mobile && pnpm codegen`
- Keep Prisma schema in sync: `cd apps/backend && pnpm prisma:generate`

### 5. Test Changes
Run these commands before marking tasks complete:
```bash
# Backend tests
cd apps/backend
pnpm test

# Mobile tests (if applicable)
cd apps/mobile
pnpm test

# Linting
pnpm lint
```

---

## Common Tasks & Workflows

### Adding a New Feature

1. **Check Requirements:** Reference `docs/02-requirements.md`
2. **Update Status:** Mark feature as "In Progress" in `PROJECT_STATUS.md`
3. **Backend First:**
   - Add Prisma schema changes in `apps/backend/prisma/schema.prisma`
   - Run `pnpm prisma:generate` and `pnpm prisma:migrate:dev`
   - Create resolver in `apps/backend/src/<module>/`
   - Add tests in `apps/backend/src/<module>/*.spec.ts`
4. **Frontend Next:**
   - Update GraphQL queries in `apps/mobile/src/gql/`
   - Run `pnpm codegen` to generate types
   - Implement UI components in `apps/mobile/src/components/`
   - Add screens in `apps/mobile/src/app/`
5. **Test End-to-End:** Start both backend and mobile, test full flow
6. **Update Status:** Mark as ✅ Done in `PROJECT_STATUS.md`

### Fixing a Bug

1. **Document First:** If not in "Known Issues", add to `PROJECT_STATUS.md`
2. **Write Test:** Create failing test that reproduces the bug
3. **Fix Code:** Implement solution following established patterns
4. **Verify Test:** Ensure test now passes
5. **Update Status:** Remove from "Known Issues" or mark as resolved

### Addressing Technical Debt

1. **Check Priority:** Review `docs/08-known-issues.md` for priority
2. **Estimate Effort:** Compare estimated hours vs available time
3. **Update Status:** Move TD item to "In Progress"
4. **Implement Fix:** Follow the "Planned Fix" section from documentation
5. **Test Thoroughly:** Ensure no regressions
6. **Update Docs:** Mark TD item as resolved in both files

---

## Code Style Guidelines

### TypeScript
- Use functional components (no class components)
- Prefer `const` over `let`, never use `var`
- Use async/await over Promise chains
- Destructure props and state

### GraphQL
- Use DataLoader for N+1 query prevention
- Add proper error handling with GraphQL errors
- Document queries and mutations with descriptions

### React Native
- Use hooks (useState, useEffect, useCallback, useMemo)
- Memoize expensive computations
- Use `React.memo` for component optimization
- Follow platform-specific conventions (iOS vs Android)

### NestJS
- Use dependency injection
- Apply proper decorators (@Injectable, @Resolver, @Query, @Mutation)
- Implement guards for authentication/authorization
- Use DTOs for input validation

---

## File Locations Reference

### Documentation
- `docs/02-requirements.md` - All functional & non-functional requirements
- `docs/03-architecture.md` - System architecture diagrams
- `docs/04-implementation.md` - Development timeline and tech stack
- `docs/08-known-issues.md` - Detailed technical debt items
- `PROJECT_STATUS.md` - **Current progress tracker (update this!)**

### Backend
- `apps/backend/prisma/schema.prisma` - Database schema
- `apps/backend/src/*/` - Feature modules (auth, user, post, event, etc.)
- `apps/backend/schema.gql` - Auto-generated GraphQL schema

### Mobile
- `apps/mobile/src/app/` - App screens (Expo Router)
- `apps/mobile/src/components/` - Reusable UI components
- `apps/mobile/src/gql/` - GraphQL queries and mutations
- `apps/mobile/src/__generated__/` - Auto-generated types (DO NOT EDIT)

### Config
- `pnpm-workspace.yaml` - Monorepo workspace definition
- `apps/backend/.env` - Backend environment variables
- `apps/mobile/app.config.js` - Expo configuration

---

## Environment Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker (for local MongoDB)
- Expo CLI

### Initial Setup
```bash
# Install dependencies
pnpm install

# Setup environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# Start MongoDB (if using Docker)
docker-compose up -d

# Run database migrations
cd apps/backend
pnpm prisma:migrate:dev

# Generate Prisma client
pnpm prisma:generate
```

### Running Development Servers
```bash
# Terminal 1: Backend
cd apps/backend
pnpm start:dev

# Terminal 2: Mobile
cd apps/mobile
pnpm start
```

---

## GraphQL Code Generation

### Backend (Auto-generated)
The GraphQL schema is auto-generated from NestJS resolvers:
```bash
cd apps/backend
pnpm start:dev  # Schema updates automatically
```

### Mobile (Must run manually)
After backend schema changes, regenerate TypeScript types:
```bash
cd apps/mobile
pnpm codegen
```

---

## Testing Commands

```bash
# Backend unit tests
cd apps/backend
pnpm test

# Backend e2e tests
pnpm test:e2e

# Backend test coverage
pnpm test:cov

# Mobile tests (if configured)
cd apps/mobile
pnpm test

# Lint all code
pnpm lint
```

---

## Git Workflow

1. **Branch Naming:**
   - Feature: `feature/<feature-name>`
   - Bug fix: `fix/<bug-description>`
   - Technical debt: `debt/<td-number>`

2. **Commit Messages:**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
   - Reference issues: `fix: resolve TD-01 JWT refresh token (#123)`

3. **Before Committing:**
   - Run linter: `pnpm lint`
   - Run tests: `pnpm test`
   - Update `PROJECT_STATUS.md` if completing a task

---

## Important Notes

### Security
- Never commit `.env` files
- Use environment variables for all secrets
- JWT tokens expire after 24 hours (see TD-01)
- Firebase admin SDK credentials in `reuseit-a37ea-firebase-adminsdk-*.json`

### Performance
- TensorFlow Lite model is 15MB (see TD-02 for optimization)
- Use DataLoader for all GraphQL relationship queries
- MongoDB queries are indexed (see `scripts/createGeoIndex.js`)

### Database
- Always use Prisma migrations (never manual schema edits)
- MongoDB replica set required for transactions
- Geospatial queries use 2dsphere indexes for location data

### CI/CD
- GitHub Actions runs on every push
- ESLint and Prettier must pass
- Tests must pass before merging

---

## Getting Help

1. **Check Documentation First:** `docs/` folder has comprehensive guides
2. **Review Similar Code:** Look at existing modules for patterns
3. **Check Known Issues:** `docs/08-known-issues.md` for common problems
4. **Project Status:** `PROJECT_STATUS.md` for current state

---

## Final Reminder

**🔴 CRITICAL: Always update [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) when:**
- Starting a new task (mark as "In Progress")
- Completing a task (mark as ✅ Done)
- Discovering a new bug (add to "Known Issues")
- Changing priorities (reorder "Next Tasks")

This keeps everyone (including future you) informed about project progress!
