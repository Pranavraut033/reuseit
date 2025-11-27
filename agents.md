# Agent Instructions for ReUseIt Project

## Overview

This document provides comprehensive instructions for AI coding assistants (GitHub Copilot, etc.) working on the ReUseIt mobile application. ReUseIt is a cross-platform mobile app that incentivizes recycling through gamification, community engagement, and AI-powered waste identification.

**Always reference [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for current progress and update it whenever completing tasks.**

---

## Project Context

**ReUseIt** is a gamified recycling application that uses AI to identify waste items and rewards users for proper recycling behavior.

### Current Status
- **Phase:** Phase 1 - Core Development (70% complete)
- **Last Updated:** November 27, 2025
- **Architecture:** Docker Compose with 6 services
- **Tech Stack:** React Native (Expo) + NestJS (GraphQL) + MongoDB + TensorFlow Lite + Ollama LLM

### Key Features (Completed)
- User authentication (JWT + Firebase OAuth)
- Community marketplace (posts, likes, comments)
- Event management system
- Gamification (points, badges)
- AI waste identification (TensorFlow Lite + LLM guidance)
- Location services (Google Maps integration)
- Educational content system

### Key Features (In Progress)
- Events mobile UI implementation
- Points awarding for waste classifications
- Leaderboard functionality
- Testing infrastructure setup

---

## Architecture

**ReUseIt** follows a modern microservices architecture deployed via Docker Compose:

### Services Overview
- **Frontend:** React Native (Expo) - iOS/Android mobile app with NativeWind styling
- **Backend:** NestJS with GraphQL (Apollo Server), Prisma ORM, JWT authentication
- **ML Services:**
  - Python ML training pipeline (TensorFlow/PyTorch) for waste classification model training
  - LLM service (FastAPI) using Ollama for advanced waste categorization and recommendations
- **Database:** MongoDB Atlas (managed) with replica set support, Redis for caching
- **ML:** TensorFlow Lite for on-device waste classification, Ollama LLM service for advanced categorization
- **Infrastructure:** Docker Compose deployment with Statping monitoring, Firebase (auth/notifications), Google Maps API

### Service Components
- **MongoDB:** Document database with geospatial indexing for location data
- **Redis:** Caching and session storage for performance optimization
- **Backend:** GraphQL API server with DataLoader for N+1 prevention
- **Ollama:** Local LLM runtime for waste classification (qwen2.5:0.5b model)
- **Waste LLM Service:** FastAPI wrapper for LLM interactions and recycling guidance
- **Statping:** Service monitoring and status dashboard with SQLite database

### Data Flow
1. **Mobile App** captures image → **TensorFlow Lite** classifies waste → **Backend** processes analysis
2. **Backend** calls **Waste LLM Service** → **Ollama** provides structured recycling guidance
3. **Backend** awards points and updates user profile in **MongoDB**
4. **Redis** caches frequent queries and session data

---

## Monorepo Structure

```
reuseit-mono/
├── apps/
│   ├── backend/           # NestJS GraphQL API server
│   ├── mobile/            # Expo React Native application
│   ├── ml-training/       # Python ML model training pipeline
│   └── waste-llm-service/ # FastAPI LLM service wrapper
├── docs/                  # Comprehensive project documentation
├── scripts/               # Utility scripts and tools
├── types/                 # Shared TypeScript type definitions
├── docker-compose.yml     # Multi-service Docker deployment
├── pnpm-workspace.yaml    # Monorepo workspace configuration
└── package.json           # Root monorepo dependencies and scripts
```

### Apps Breakdown
- **backend:** NestJS server with GraphQL, Prisma, authentication, business logic
- **mobile:** Expo React Native app with camera, ML inference, maps, social features
- **ml-training:** Python scripts for dataset preparation, model training, TFLite export
- **waste-llm-service:** FastAPI service for LLM interactions and recycling knowledge base

---

## Core Principles

### 1. Always Check Project Status First
Before starting any work, read [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) to understand:
- Current sprint goals and priorities
- Completed features and known issues
- Technical debt and next tasks
- Testing and deployment status

### 2. Update Status After Completing Tasks
When completing tasks:
1. Mark as ✅ Done in `PROJECT_STATUS.md`
2. Update the "Last Updated" timestamp
3. Move task from "In Progress" to "Completed Features"
4. Add any discovered issues to "Known Issues" section
5. Update progress percentages

### 3. Follow Established Patterns
- **Backend:** NestJS decorators, DTOs, GraphQL resolvers, DataLoader for N+1 prevention
- **Frontend:** Functional React components with hooks, TypeScript strict mode
- **State:** Apollo Client for server state, Zustand for global UI state, React Query for API calls
- **Styling:** NativeWind (Tailwind CSS for React Native) with consistent design tokens
- **Validation:** Yup schemas on frontend, class-validator on backend
- **ML:** TensorFlow Lite for on-device inference, Ollama for LLM guidance

### 4. Maintain Type Safety
- Never use `any` type - always define proper TypeScript interfaces
- Generate GraphQL types automatically: `cd apps/mobile && pnpm codegen`
- Keep Prisma schema synchronized: `cd apps/backend && pnpm prisma:generate`
- Use shared types from `types/` directory across services

### 5. Test Changes Thoroughly
Run these commands before marking tasks complete:
```bash
# Backend tests
cd apps/backend
pnpm test
pnpm test:e2e

# Mobile tests (when available)
cd apps/mobile
pnpm test

# Linting and formatting
pnpm lint
pnpm format
```

---

## Common Tasks & Workflows

### Adding a New Feature

1. **Check Requirements:** Reference `docs/02-requirements.md` and `PROJECT_STATUS.md`
2. **Update Status:** Mark feature as "In Progress" in `PROJECT_STATUS.md`
3. **Backend First Approach:**
   - Add Prisma schema changes in `apps/backend/prisma/schema.prisma`
   - Run `pnpm prisma:generate` and `pnpm prisma:migrate:dev`
   - Create/update GraphQL resolver in `apps/backend/src/[module]/`
   - Add comprehensive tests in `apps/backend/src/[module]/*.spec.ts`
4. **Frontend Implementation:**
   - Update GraphQL queries/mutations in `apps/mobile/src/gql/`
   - Run `pnpm codegen` to generate TypeScript types
   - Implement UI components in `apps/mobile/src/components/`
   - Create/update screens in `apps/mobile/src/app/` (Expo Router)
5. **Integration Testing:** Start full stack with Docker and test end-to-end flow
6. **Update Status:** Mark as ✅ Done in `PROJECT_STATUS.md`

### Fixing a Bug

1. **Document Issue:** Add to "Known Issues" in `PROJECT_STATUS.md` if not already there
2. **Reproduce:** Create failing test case that demonstrates the bug
3. **Fix Implementation:** Follow established patterns and maintain type safety
4. **Verify Fix:** Ensure test passes and no regressions introduced
5. **Update Status:** Remove from "Known Issues" or mark as resolved

### Working with ML Components

1. **Model Training:** Use `apps/ml-training/` scripts for dataset preparation and training
2. **Model Export:** Convert trained models to TFLite format for mobile deployment
3. **LLM Integration:** Update knowledge base in `apps/waste-llm-service/` for recycling guidance
4. **Testing:** Validate model accuracy and LLM response quality

### Addressing Technical Debt

1. **Review Priority:** Check `docs/08-known-issues.md` and `PROJECT_STATUS.md`
2. **Estimate Impact:** Assess effort vs. current sprint capacity
3. **Implementation:** Follow the documented "Planned Fix" in issue description
4. **Testing:** Ensure no regressions and improved performance/maintainability
5. **Documentation:** Update relevant docs and mark issue as resolved

---

## File Locations Reference

### Documentation
- `docs/01-introduction.md` - Project overview and objectives
- `docs/02-requirements.md` - Functional and non-functional requirements
- `docs/03-architecture.md` - Detailed system architecture diagrams
- `docs/04-implementation.md` - Development timeline and technology decisions
- `docs/05-testing.md` - Testing strategy and guidelines
- `docs/06-installation.md` - Setup and installation procedures
- `docs/07-api-reference.md` - GraphQL API documentation
- `docs/08-known-issues.md` - Technical debt and known problems
- `docs/09-lessons-learned.md` - Project insights and retrospective
- `PROJECT_STATUS.md` - **Current progress tracker (always check this first!)**

### Backend (NestJS)
- `apps/backend/prisma/schema.prisma` - Database schema and migrations
- `apps/backend/src/auth/` - Authentication guards and strategies
- `apps/backend/src/user/` - User profile management
- `apps/backend/src/post/` - Community marketplace posts
- `apps/backend/src/event/` - Event creation and management
- `apps/backend/src/point/` - Gamification points system
- `apps/backend/src/recycling/` - Waste analysis and classification
- `apps/backend/src/shared/` - Common utilities and types
- `apps/backend/schema.gql` - Auto-generated GraphQL schema

### Mobile (React Native)
- `apps/mobile/src/app/` - Expo Router screens and navigation
- `apps/mobile/src/components/` - Reusable UI components
- `apps/mobile/src/gql/` - GraphQL queries and mutations
- `apps/mobile/src/hooks/` - Custom React hooks
- `apps/mobile/src/store/` - Zustand global state management
- `apps/mobile/src/utils/` - Helper functions and constants
- `apps/mobile/assets/` - Images, fonts, and static assets
- `apps/mobile/src/__generated__/` - Auto-generated GraphQL types (DO NOT EDIT)

### ML Training (Python)
- `apps/ml-training/train.py` - Main training script with data pipeline
- `apps/ml-training/validate_tflite.py` - Model validation utilities
- `apps/ml-training/export_tflite.py` - TensorFlow to TFLite conversion
- `apps/ml-training/config.py` - Training configuration and hyperparameters
- `apps/ml-training/dataset_utils.py` - Dataset loading and preprocessing
- `apps/ml-training/waste_classifier_best_dynamic.tflite` - Trained model for mobile
- `apps/ml-training/requirements.txt` - Python dependencies

### LLM Service (FastAPI)
- `apps/waste-llm-service/app/main.py` - FastAPI application entry point
- `apps/waste-llm-service/app/models/` - LLM interaction models
- `apps/waste-llm-service/app/knowledge_base/` - Recycling guidance data
- `apps/waste-llm-service/requirements.txt` - Python dependencies
- `apps/waste-llm-service/Dockerfile` - Container build configuration

### Shared Types
- `types/` - TypeScript interfaces shared between backend and mobile
- `types/graphql.ts` - GraphQL type definitions
- `types/models.ts` - Domain model interfaces

### Configuration
- `docker-compose.yml` - Multi-service Docker deployment
- `pnpm-workspace.yaml` - Monorepo workspace configuration
- `apps/backend/.env.example` - Backend environment variables template
- `apps/mobile/app.config.js` - Expo application configuration
- `eslint.config.js` - Linting configuration
- `prettier.config.js` - Code formatting configuration

---

## Environment Setup

### Prerequisites
- **Node.js:** 18+ (LTS recommended)
- **pnpm:** 8+ (package manager for monorepo)
- **Docker:** 24+ with Docker Compose
- **Expo CLI:** Latest version for mobile development
- **Python:** 3.8+ (for ML training and LLM service)
- **Git:** Latest version for version control

### Initial Setup
```bash
# Clone repository
git clone https://github.com/Pranavraut033/reuseit.git
cd reuseit-mono

# Install root dependencies
pnpm install

# Setup Python environments for ML services
cd apps/ml-training
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
deactivate

cd ../waste-llm-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
deactivate

# Setup environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# Start all services with Docker
docker-compose up -d

# Wait for services to be healthy, then run database setup
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate:dev

# Generate GraphQL types for mobile
cd ../mobile
pnpm codegen
```

### GraphQL Code Generation

#### Backend (Auto-generated)
The GraphQL schema is auto-generated from NestJS resolvers when the backend runs in development mode.

#### Mobile (Manual Generation Required)
After any backend GraphQL schema changes:
```bash
cd apps/mobile
pnpm codegen
```

### Development Servers

#### Full Stack (Recommended)
```bash
# Start all services
docker-compose up -d

# Backend will be available at http://localhost:3000/graphql
# Statping monitoring at http://localhost:8080
```

#### Individual Services
```bash
# Backend only
cd apps/backend
pnpm start:dev

# Mobile only (requires backend running)
cd apps/mobile
pnpm start

# ML training environment
cd apps/ml-training
source venv/bin/activate
python train.py

# LLM service only
cd apps/waste-llm-service
source venv/bin/activate
uvicorn app.main:app --reload
```

---

## Testing Commands

### Backend Testing
```bash
cd apps/backend

# Unit tests
pnpm test

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:cov

# End-to-end tests
pnpm test:e2e

# Debug mode
pnpm test:debug
```

### Mobile Testing
```bash
cd apps/mobile

# Run tests (when test suite is implemented)
pnpm test

# Lint and format
pnpm lint
```

### ML Model Validation
```bash
cd apps/ml-training

# Validate trained model
python validate_tflite.py

# Test model with sample data
python test_and_visualize.py
```

### LLM Service Testing
```bash
cd apps/waste-llm-service

# Test API endpoints (when implemented)
# Add testing commands as service matures
```

### Full Stack Linting
```bash
# Root level commands
pnpm lint
pnpm format
pnpm format:check
```

---

## Important Notes

### Security
- Never commit `.env` files or API keys
- Use environment variables for all sensitive configuration
- JWT tokens expire after 24 hours (configurable)
- Firebase service account keys are required for authentication
- MongoDB connection strings must include authentication credentials

### Performance
- Use DataLoader for all GraphQL resolvers to prevent N+1 queries
- Redis caching is configured for frequently accessed data
- MongoDB indexes are critical for geospatial queries
- TensorFlow Lite models are optimized for mobile inference
- Image preprocessing happens on-device to reduce network usage

### Database
- Always use Prisma migrations for schema changes (never manual MongoDB modifications)
- MongoDB replica set is required for transactions and high availability
- Geospatial indexes use 2dsphere for location-based queries
- Backup strategy should be implemented for production deployments

### CI/CD
- GitHub Actions workflows are planned but not yet implemented
- ESLint and Prettier must pass before commits
- Automated testing is planned but not yet configured
- Docker-based deployment is the target for production

### ML Operations
- Model training requires significant computational resources
- TFLite conversion optimizes models for mobile deployment
- LLM service uses qwen2.5:0.5b for efficient inference
- Model accuracy validation is critical before deployment
- Knowledge base updates require LLM service restart

---

## Getting Help

### Primary Resources
1. **PROJECT_STATUS.md** - Current project state, priorities, and progress
2. **docs/** folder - Comprehensive documentation for all aspects
3. **Existing Code** - Review similar implementations in the codebase
4. **GitHub Issues** - Check existing issues and discussions

### Development Workflow
1. **Check Status:** Always read `PROJECT_STATUS.md` first
2. **Plan Changes:** Understand impact on existing features
3. **Follow Patterns:** Maintain consistency with established architecture
4. **Test Thoroughly:** Validate changes don't break existing functionality
5. **Update Documentation:** Keep `PROJECT_STATUS.md` current

### Common Issues
- **MongoDB Connection:** Ensure Docker services are running and healthy
- **GraphQL Types:** Run `pnpm codegen` after schema changes
- **ML Models:** Verify TFLite model is properly bundled in mobile app
- **Environment Variables:** Check all required `.env` variables are set

---

## Final Reminder

**🔴 CRITICAL: Always update [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) when:**
- Starting a new task (mark as "In Progress")
- Completing a task (mark as ✅ Done)
- Discovering a new bug (add to "Known Issues")
- Changing priorities (reorder "Next Tasks")

**This ensures everyone stays aligned on project progress and prevents duplicated work.**
