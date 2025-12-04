# Agent Instructions for ReUseIt Project

## 🚨 CORE RULES (Read First)

**ALWAYS check [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) before any work.**

### Critical Behaviors
- **NEVER** create new architecture without checking existing patterns
- **NEVER** introduce libraries without checking `package.json`
- **NEVER** invent files, folders, types, or APIs - verify with tools first
- **ALWAYS** update `PROJECT_STATUS.md` after completing tasks
- **PREFER** modifying existing modules over creating new ones
- **ALWAYS** use `i18n.ts` for displaying text and create/update translation keys if necessary

### Tech Stack Rules
- **Backend:** NestJS + GraphQL + Prisma + MongoDB
- **Frontend:** React Native (Expo) + NativeWind (native only, no web support - avoid web-only classes like space-x/space-y)
- **State:** Apollo Client (server) + Zustand (global UI)
- **Types:** Strict TypeScript - never use `any`
- **Styling:** NativeWind with consistent design tokens

### File Operations
- **NEVER** edit files without reading them first
- **ALWAYS** use absolute paths for file operations
- **VERIFY** file existence before operations
- **TEST** changes immediately after editing

---

## 📁 DIRECTORY PURPOSE CHEATSHEET

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `apps/backend/` | NestJS GraphQL API server | `prisma/schema.prisma`, `src/modules/` |
| `apps/mobile/` | Expo React Native app | `src/app/` (Expo Router), `src/components/` |
| `apps/ml-training/` | Python ML model training | `train.py`, `waste_classifier_best_dynamic.tflite` |
| `docs/` | Project documentation | `PROJECT_STATUS.md`, `02-requirements.md` |
| `types/` | Shared TypeScript interfaces | `graphql.ts`, `models.ts` |

---

## 🎯 EXPLICIT AGENT BEHAVIORS

### When Adding Features
1. **Check `PROJECT_STATUS.md`** for current priorities
2. **Backend first:** Schema → Resolver → Tests
3. **Run:** `pnpm prisma:generate && pnpm prisma:migrate:dev`
4. **Mobile:** Update GraphQL queries → `pnpm codegen` → Implement UI
5. **Mark complete** in `PROJECT_STATUS.md`

### When Editing Code
- **Read files** before editing (large chunks preferred)
- **Follow patterns:** NestJS decorators, functional React components
- **Maintain type safety:** Generate GraphQL types automatically
- **Test immediately:** Backend (`pnpm test`), Mobile (`pnpm test`)

### When Creating Components
- **Use NativeWind** - avoid web-only classes (space-x, space-y, etc.)
- **Follow design language:** Vibrant colors, playful icons, mobile-first
- **Export from index** files for clean imports

### When Running Commands
- **Use absolute paths** for file operations
- **Prefer `run_in_terminal`** over manual commands
- **Check output** before proceeding
- **Backend Development:** Use `pnpm --filter backend run start:dev` (Docker excluded to avoid rebuilds)
- **Backend Production:** Use `docker-compose --profile production up backend` for deployment

---

## 🚫 GUARDRAILS AGAINST HALLUCINATION

### File/Folder Verification
- **ALWAYS** use `list_dir` or `file_search` to verify paths exist
- **NEVER** assume file locations - search first
- **VERIFY** imports exist before using them

### API/Type Verification
- **CHECK** existing GraphQL schema before adding queries
- **VERIFY** TypeScript types in `types/` directory
- **NEVER** invent database fields - check Prisma schema

### Library Verification
- **CHECK** `package.json` before suggesting new dependencies
- **VERIFY** existing utilities before creating new ones
- **PREFER** built-in or existing solutions

---

## 📖 DETAILED REFERENCE

### Project Context
**ReUseIt** is a gamified recycling app using AI for waste identification.

**Current Status:** Phase 1 - Core Development (70% complete)
**Tech Stack:** React Native (Expo) + NestJS (GraphQL) + MongoDB + TensorFlow Lite + Ollama LLM

### Architecture Overview
- **Frontend:** React Native (Expo) with NativeWind styling
- **Backend:** NestJS with GraphQL, Prisma ORM, JWT auth
- **ML Services:** Python training pipeline + Ollama integration
- **Database:** MongoDB Atlas with Redis caching
- **Deployment:** Docker Compose with multiple services

### Design Language
Modern, clean, fun, user-friendly design:
- **Colors:** Vibrant palette with gradients and shadows
- **Typography:** Clear hierarchy (headings, subheadings, body)
- **Icons:** Playful icons, illustrations, micro-animations
- **Layout:** Improved spacing and grouping for scannability
- **Key Elements:** Highlight eco points, instructions, confidence with cards/badges
- **Interactivity:** Subtle visual cues for touch interactions
- **Mobile-First:** Touch-friendly design
- **Variations:** Futuristic, gamified, minimalistic approaches

---

## 🔧 DEVELOPMENT WORKFLOWS

### Adding a New Feature
1. **Check Requirements:** Reference `docs/02-requirements.md` and `PROJECT_STATUS.md`
2. **Update Status:** Mark as "In Progress" in `PROJECT_STATUS.md`
3. **Backend First:**
   - Add Prisma schema in `apps/backend/prisma/schema.prisma`
   - Run `pnpm prisma:generate && pnpm prisma:migrate:dev`
   - Create/update resolver in `apps/backend/src/[module]/`
   - Add tests in `apps/backend/src/[module]/*.spec.ts`
4. **Frontend:**
   - Update GraphQL in `apps/mobile/src/gql/`
   - Run `pnpm codegen` for TypeScript types
   - Implement components in `apps/mobile/src/components/`
   - Create screens in `apps/mobile/src/app/` (Expo Router)
5. **Integration Testing:** Start Docker stack and test end-to-end
6. **Update Status:** Mark ✅ Done in `PROJECT_STATUS.md`

### Fixing Bugs
1. **Document** in "Known Issues" section of `PROJECT_STATUS.md`
2. **Reproduce** with failing test case
3. **Fix** following established patterns
4. **Verify** test passes and no regressions
5. **Remove** from "Known Issues"

### Testing Commands
```bash
# Backend (Local Development - Fast)
cd apps/backend && pnpm test && pnpm test:e2e

# Backend (Docker Production - Only when needed)
docker-compose --profile production up backend --build
# Then test against containerized backend

# Mobile (when available)
cd apps/mobile && pnpm test

# Linting
pnpm lint && pnpm format
```

### Running Python Code

To run Python scripts in the ML training module:

1. Navigate to the `apps/ml-training/` directory
2. Activate the virtual environment: `source .venv/bin/activate`
3. Run the Python file: `python object_detection/train.py` (replace with the desired script)

**⚠️ CRITICAL FOR AGENTS:** Always activate the virtual environment before running any Python scripts. Do not use `python` or `python3` directly as they do not have the required libraries installed. Use the full command sequence in terminal: `cd apps/ml-training && source .venv/bin/activate && python <script.py>`

---

## 📂 FILE LOCATIONS REFERENCE

### Backend (NestJS)
- `apps/backend/prisma/schema.prisma` - Database schema
- `apps/backend/src/auth/` - Authentication
- `apps/backend/src/user/` - User management
- `apps/backend/src/post/` - Community posts
- `apps/backend/src/event/` - Events
- `apps/backend/src/point/` - Gamification
- `apps/backend/src/recycling/` - Waste analysis

### Mobile (React Native)
- `apps/mobile/src/app/` - Expo Router screens
- `apps/mobile/src/components/` - Reusable UI components
- `apps/mobile/src/gql/` - GraphQL queries/mutations
- `apps/mobile/src/hooks/` - Custom React hooks
- `apps/mobile/src/store/` - Zustand state management

### ML Services
- `apps/ml-training/` - Python training scripts

### Configuration
- `docker-compose.yml` - Service deployment (backend excluded from dev, use `--profile production` for deployment)
- `apps/backend/.env.example` - Environment variables
- `apps/mobile/app.config.js` - Expo configuration

---

## ⚠️ IMPORTANT NOTES

### Security
- Never commit `.env` files or API keys
- Use environment variables for sensitive config
- JWT tokens expire after 24 hours

### Performance
- Use DataLoader for GraphQL resolvers (N+1 prevention)
- Redis caching for frequent queries
- MongoDB geospatial indexes for location queries

### Database
- Always use Prisma migrations for schema changes
- MongoDB replica set required for transactions
- Geospatial queries use 2dsphere indexes

---

## 🆘 GETTING HELP

1. **PROJECT_STATUS.md** - Current state and priorities
2. **docs/** folder - Detailed documentation
3. **Existing Code** - Review similar implementations
4. **GitHub Issues** - Check existing discussions

### Common Issues
- **MongoDB:** Ensure Docker services running
- **GraphQL:** Run `pnpm codegen` after schema changes
- **Types:** Check `types/` directory for shared interfaces
- **Backend Docker:** Only use for production deployment (`docker-compose --profile production up backend`)

---

## 📋 FINAL REMINDER

**🔴 CRITICAL:** Always update `PROJECT_STATUS.md` when:
- Starting tasks (mark "In Progress")
- Completing tasks (mark ✅ Done)
- Finding bugs (add to "Known Issues")
- Changing priorities (reorder tasks)
