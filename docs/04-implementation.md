# 4. Implementation

## 4.1 Development Methodology

**Approach:** Agile/Scrum with 2-week sprints

**Tools:**
- **Version Control:** Git + GitHub
- **Project Management:** GitHub Projects (Kanban board)
- **CI/CD:** GitHub Actions
- **Communication:** Self-managed (solo project)

**Sprint Structure:**
- Sprint planning (2 hours)
- Daily standups (self-reflection, 15 min)
- Sprint review (1 hour)
- Sprint retrospective (30 min)

---

## 4.2 Development Timeline

### Sprint 1: Foundation (Oct 1 - Oct 14, 2024)

**Focus:** Core infrastructure and authentication

**Deliverables:**
- ✅ Monorepo setup (pnpm workspaces)
- ✅ Backend scaffolding (NestJS + Prisma)
- ✅ Mobile app initialization (Expo)
- ✅ MongoDB Atlas replica set configuration
- ✅ Authentication API (register, login, JWT)
- ✅ CI/CD pipeline (ESLint, Prettier, test runner)

**Challenges:**
- MongoDB replica set setup for Prisma transactions
- Expo + NativeWind configuration conflicts

---

### Sprint 2: Content & Education (Oct 15 - Oct 28, 2024)

**Focus:** Article management and educational features

**Deliverables:**
- ✅ Article schema (Prisma model)
- ✅ GraphQL queries for content browsing
- ✅ Search functionality with text indexes
- ✅ Mobile UI for article listing and detail views
- ✅ Bookmark functionality with offline caching

**Challenges:**
- Apollo Client cache normalization
- Text search performance optimization

---

### Sprint 3: Community Features (Oct 29 - Nov 11, 2024)

**Focus:** Posts, events, and social interactions

**Deliverables:**
- ✅ Post creation with image upload (Expo ImagePicker)
- ✅ Event management system
- ✅ Google Maps integration
- ✅ Like and comment functionality
- ✅ Real-time feed updates

**Challenges:**
- Google Maps API migration from Mapbox
- Geospatial query optimization (2dsphere indexes)
- Image compression strategy

---

### Sprint 4: Machine Learning (Nov 12 - Nov 25, 2024)

**Focus:** TensorFlow Lite integration

**Deliverables:**
- ✅ TensorFlow Lite model integration
- ✅ Camera permission handling
- ✅ Image preprocessing pipeline
- ✅ Offline model loading
- ✅ Result display with confidence scores

**Challenges:**
- Model size optimization (15MB → 8MB with quantization)
- Inference speed on low-end devices
- Training data collection (600+ labeled images)

**Dataset:** Custom recyclables dataset + TrashNet subset

---

### Sprint 5: Gamification (Nov 26 - Dec 9, 2024)

**Focus:** Points, badges, and leaderboards

**Deliverables:**
- ✅ Points calculation service
- ✅ Badge unlock logic (5 badges implemented)
- ✅ Leaderboard aggregation
- ✅ User profile statistics
- ✅ Achievement notifications

**Challenges:**
- Race condition prevention in point awards
- Efficient leaderboard queries (aggregation pipelines)

---

### Sprint 6: Polish & Testing (Dec 10 - Dec 23, 2024)

**Focus:** Quality assurance and deployment preparation

**Deliverables:**
- ✅ Unit test suite (83% coverage)
- ✅ E2E tests (Detox for critical flows)
- ✅ UI consistency audit
- ✅ Performance profiling
- ✅ APK build for Android
- ✅ Documentation finalization

**Challenges:**
- Detox setup on CI environment
- Android release signing configuration

---

## 4.3 Technology Stack

### Frontend (Mobile)

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.72 | Cross-platform framework |
| Expo | 49 | Managed workflow |
| TypeScript | 5.1 | Type safety |
| Apollo Client | 3.8 | GraphQL client |
| React Hook Form | 7.48 | Form management |
| Yup | 1.3 | Schema validation |
| TensorFlow Lite | 2.14 | On-device ML |
| React Navigation | 6.1 | Routing |
| Zustand | 4.4 | State management |
| NativeWind | 2.0 | Tailwind for RN |

### Backend (API)

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.2 | Server framework |
| Apollo Server | 4.9 | GraphQL server |
| Prisma | 5.6 | ORM |
| TypeScript | 5.1 | Type safety |
| Passport JWT | 10.1 | Authentication |
| bcrypt | 5.1 | Password hashing |
| class-validator | 0.14 | DTO validation |
| DataLoader | 2.2 | Query batching |

### Infrastructure

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Database (M0 tier) |
| Firebase Auth | OAuth provider |
| Firebase Cloud Messaging | Push notifications |
| Google Maps API | Geocoding + Places |
| Railway | Backend hosting |
| GitHub Actions | CI/CD |
| Expo EAS | Mobile builds |

---

## 4.4 Development Environment

### Required Tools

```bash
node -v       # v18.18.0
pnpm -v       # 8.10.0
expo --version # 49.0.0
```

### Workspace Structure

```
reuseit-mono/
├── apps/
│   ├── backend/       # NestJS API
│   └── mobile/        # Expo app
├── docs/              # This documentation
├── scripts/           # Utility scripts
├── pnpm-workspace.yaml
└── package.json       # Root scripts
```

### Available Commands

```bash
# Development
pnpm --filter backend start:dev
pnpm --filter mobile start

# Testing
pnpm --filter backend test
pnpm --filter backend test:e2e

# Code Quality
pnpm lint           # ESLint (all packages)
pnpm format         # Prettier (all packages)

# Database
pnpm --filter backend prisma:migrate
pnpm --filter backend prisma:studio
```

---

## 4.5 Code Quality Standards

### Linting & Formatting

**ESLint Configuration:**
- Extends `@typescript-eslint/recommended`
- Rules: `no-unused-vars`, `no-console` (warn)
- Auto-fix on save (VS Code)

**Prettier Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

### Git Workflow

**Commit Convention:** Conventional Commits

```
feat: add point calculation service
fix: resolve image upload race condition
docs: update API documentation
test: add E2E test for post creation
```

**Branching Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fixes

---

## 4.6 API Design Principles

### GraphQL Schema Design

**Naming Conventions:**
- Types: PascalCase (`User`, `Post`)
- Fields: camelCase (`createdAt`, `likesCount`)
- Enums: UPPER_SNAKE_CASE (`CATEGORY_ELECTRONICS`)

**Query Example:**
```graphql
query GetPosts($filter: PostFilterInput) {
  posts(filter: $filter) {
    id
    title
    author {
      id
      name
    }
    likesCount
  }
}
```

**Mutation Example:**
```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    createdAt
  }
}
```

### Error Handling

**Standardized Error Format:**
```typescript
throw new ApolloError('User not found', 'USER_NOT_FOUND', {
  userId: '123',
});
```

**Client-Side Handling:**
```typescript
const [mutate, { error }] = useMutation(CREATE_POST);

if (error?.extensions?.code === 'USER_NOT_FOUND') {
  // Handle specific error
}
```

---

## 4.7 Database Design Decisions

### Why MongoDB?

1. **Flexible Schema** - Posts with varying fields (images, location)
2. **Geospatial Queries** - Native GeoJSON support
3. **Document Model** - Natural fit for nested data (comments, badges)
4. **Scalability** - Atlas handles sharding automatically

### Schema Evolution

**Migration Strategy:**
- Prisma migrations in development
- Manual validation in production
- Backward-compatible changes only

**Example Migration:**
```bash
pnpm --filter backend prisma:migrate dev --name add-post-tags
```

---

## 4.8 Testing Philosophy

**Test Pyramid Distribution:**
- **60% Unit Tests** - Business logic in services
- **30% Integration Tests** - API endpoint validation
- **10% E2E Tests** - Critical user flows

**Coverage Goals:**
- Overall: >80%
- Business logic (services): >90%
- Resolvers: >85%

---

## 4.9 Performance Benchmarks

### Backend API

| Endpoint | Avg Response Time | p95 | p99 |
|----------|-------------------|-----|-----|
| `login` | 180ms | 250ms | 320ms |
| `posts` (feed) | 120ms | 200ms | 280ms |
| `createPost` | 240ms | 350ms | 480ms |
| `events` (map) | 95ms | 150ms | 210ms |

**Tested with:** Artillery (500 concurrent users)

### Mobile App

| Metric | Value |
|--------|-------|
| Time-to-Interactive | 1.8s |
| JS Bundle Size | 3.2 MB |
| Image Classification | 2.1s avg |
| Initial Memory Usage | 85 MB |

**Tested on:** Samsung Galaxy S21 (Android 13)

---

**Previous:** [← Architecture](03-architecture.md) | **Next:** [Testing →](05-testing.md)
