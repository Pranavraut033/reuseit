# Setup

This document provides verified steps to run the ReUseIt project for development.

## Prerequisites

- Node.js (LTS version)
- pnpm package manager
- Docker and Docker Compose
- Python 3.10+ (for ML training)

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Environment Configuration

Create environment files from examples:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Edit the `.env` files with appropriate values for your development environment.

## 3. Start Infrastructure Services

```bash
# Start MongoDB, Redis, Ollama, and monitoring services
docker-compose up -d
```

## 4. Setup Backend

```bash
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed  # Optional: loads sample data
```

## 5. Start Backend Development Server

```bash
pnpm --filter backend run start:dev
```

## 6. Setup Mobile App

```bash
pnpm --filter mobile run start
```

## 7. ML Training Setup (Optional)

```bash
cd apps/ml-training
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Training scripts are now ready to run
```

## Verification

- **Backend API**: http://localhost:3000/graphql (GraphQL Playground)
- **Mobile App**: Connects to backend and shows login screen
- **Database**: User registration works and data persists

---

**Last Updated**: December 2025
