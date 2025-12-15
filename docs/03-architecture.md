# 3. Architecture

## System Overview

ReUseIt follows a modern microservices architecture deployed via Docker Compose.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │────│    NestJS API   │────│   MongoDB       │
│   (Expo)        │    │  (GraphQL)      │    │   Redis         │
│                 │    │                 │    │                 │
│ • Mobile UI     │    │ • Auth Service  │    │ • User Data     │
│ • Camera/ML     │    │ • Business Logic│    │ • Cache         │
│ • Offline Cache │    │ • DataLoader    │    │ • Sessions      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Ollama LLM    │    │   LLM API       │
                    │   (qwen2.5:0.5b)│    │  (FastAPI)      │
                    │                 │    │                 │
                    │ • AI Analysis   │    │ • Recycling     │
                    │ • Model Runtime │    │ • Instructions  │
                    └─────────────────┘    └─────────────────┘
```

---

## 3.2 Component Breakdown

### 3.2.1 Mobile Client (React Native)

**Responsibility:** Presentation layer and client-side logic

**Key Technologies:**

- **React Native 0.72** - Core framework
- **Expo SDK 49** - Managed workflow for rapid development
- **Apollo Client 3.8** - GraphQL client with normalized caching
- **React Navigation 6** - Screen routing
- **React Hook Form + Yup** - Form management and validation
- **TensorFlow Lite** - On-device ML inference

**Structure:**

```
mobile/src/
├── app/                    # Expo Router screens
├── components/             # Reusable UI components
├── gql/                    # GraphQL queries/mutations
├── hooks/                  # Custom React hooks
├── store/                  # Global state (Zustand)
└── utils/                  # Helper functions
```

**State Management:**

- **Server State:** Apollo Client cache
- **UI State:** Zustand (global) + useState (local)
- **Form State:** React Hook Form

---

### 3.2.2 API Gateway (NestJS Backend)

**Responsibility:** Business logic, authentication, and data orchestration

**Key Technologies:**

- **NestJS 10** - Progressive Node.js framework
- **Apollo Server 4** - GraphQL server
- **Prisma 5.6** - Type-safe ORM
- **Passport JWT** - Authentication strategy
- **DataLoader** - Batch and cache database queries

**Modular Architecture:**

```
backend/src/
├── auth/                   # Authentication & JWT
├── user/                   # User profiles & settings
├── post/                   # Community marketplace
├── event/                  # Event management
├── points/                 # Gamification logic
├── location/               # Recycling centers
├── firebase/               # Push notifications
├── google-maps/            # Geocoding service
└── prisma/                 # Database client
```

**Design Patterns:**

- **Dependency Injection** - NestJS IoC container
- **Repository Pattern** - Prisma service abstraction
- **DataLoader Pattern** - N+1 query optimization

---

### 3.2.3 Data Layer (MongoDB Atlas)

**Responsibility:** Persistent data storage

**Schema Design:**

**Users Collection:**

```typescript
{
  id: string
  email: string (unique)
  passwordHash: string
  name: string
  avatar?: string
  points: number
  badges: Badge[]
  createdAt: DateTime
}
```

**Posts Collection:**

```typescript
{
  id: string
  title: string
  description?: string
  category: CategoryEnum
  condition: ConditionEnum
  images: string[]
  tags: string[]
  location?: {
    type: "Point"
    coordinates: [longitude, latitude]
  }
  authorId: string
  likesCount: number
  commentsCount: number
  createdAt: DateTime
}
```

**Events Collection:**

```typescript
{
  id: string
  title: string
  description: string
  location: GeoJSON Point
  startDate: DateTime
  endDate: DateTime
  maxParticipants: number
  participants: string[]  // User IDs
  qrCode: string
}
```

**Indexes:**

- `posts.location` - 2dsphere (geospatial queries)
- `posts.authorId` - For user post lookups
- `users.email` - Unique constraint

---

## 3.3 Data Flow Diagrams

### 3.3.1 User Authentication Flow

```
┌──────┐                ┌────────┐                ┌──────────┐
│Client│                │Backend │                │ Firebase │
└───┬──┘                └───┬────┘                └────┬─────┘
    │ 1. Google Sign-In     │                          │
    │ ─────────────────────>│                          │
    │                       │ 2. Verify Token          │
    │                       │ ─────────────────────────>│
    │                       │                          │
    │                       │<─ 3. User Info ──────────│
    │                       │ 4. Find/Create User      │
    │                       │ (Database)               │
    │                       │ 5. Generate JWT          │
    │<─ 6. JWT + User ──────│                          │
    │ 7. Store Token        │                          │
    │ (SecureStore)         │                          │
```

### 3.3.2 Post Creation Flow

```
┌──────┐            ┌────────┐            ┌──────────┐
│Client│            │Backend │            │ Database │
└───┬──┘            └───┬────┘            └────┬─────┘
    │ 1. Create Post    │                      │
    │   (GraphQL)       │                      │
    │ ─────────────────>│                      │
    │                   │ 2. Validate Auth     │
    │                   │    (JWT Guard)       │
    │                   │ 3. Insert Post       │
    │                   │ ────────────────────>│
    │                   │                      │
    │                   │<─ 4. New Post ───────│
    │                   │ 5. Award Points      │
    │                   │    (+10 pts)         │
    │                   │ ────────────────────>│
    │<─ 6. Post Data ───│                      │
    │ 7. Update Cache   │                      │
    │   (Apollo)        │                      │
```

### 3.3.3 ML Identification Flow

```
┌──────┐                        ┌──────────────┐
│Client│                        │ TensorFlow   │
│      │                        │ Lite (Local) │
└───┬──┘                        └──────┬───────┘
    │ 1. Capture Image                 │
    │    (Camera API)                  │
    │ 2. Resize & Compress             │
    │    (max 1920x1920, 80% quality)  │
    │ 3. Convert to Tensor             │
    │ ────────────────────────────────>│
    │                                  │
    │                4. Run Inference  │
    │                   (mobilenet_v2) │
    │<─ 5. Predictions ────────────────│
    │    [{label, confidence}, ...]    │
    │ 6. Display Results               │
    │    (Top 3 predictions)           │
```

---

## 3.4 Security Architecture

### 3.4.1 Authentication Flow

1. **User Login** → Firebase/Email validation
2. **JWT Generation** → Access token (24h) + Refresh token (30d)
3. **Token Storage** → Expo SecureStore (encrypted)
4. **API Requests** → Authorization header: `Bearer <token>`
5. **Token Expiry** → Automatic refresh via interceptor

### 3.4.2 Authorization Guards

```typescript
@UseGuards(JwtAuthGuard)  // Global authentication
@UseGuards(RolesGuard)    // Role-based access (future)
```

### 3.4.3 Data Validation

- **Input Validation:** Yup schemas on client + class-validator on server
- **SQL Injection:** Prevented by Prisma's parameterized queries
- **XSS:** React Native auto-escapes user input

---

## 3.5 Performance Optimizations

### 3.5.1 Database

- **Geospatial Indexes** for location queries
- **Connection Pooling** via Prisma (max 10 connections)
- **Denormalization** of `likesCount` and `commentsCount`

### 3.5.2 API

- **DataLoader** batching reduces N+1 queries
- **Field-level caching** with `@cacheControl` directives
- **Query complexity limits** prevent abuse

### 3.5.3 Client

- **Apollo Normalized Cache** eliminates redundant fetches
- **Image lazy loading** with `react-native-fast-image`
- **Virtualized lists** with `FlashList`

---

## 3.6 Deployment Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   Client    │      │   Backend    │      │  Database  │
│   (Expo)    │◄────►│  (Railway)   │◄────►│   (Atlas)  │
│   APK/IPA   │      │  Docker      │      │   Replica  │
└─────────────┘      └──────────────┘      └────────────┘
      │                     │
      │                     ▼
      │              ┌──────────────┐
      │              │  Firebase    │
      └─────────────►│  (Auth, FCM) │
                     └──────────────┘
```

**Hosting:**

- **Backend:** Railway (containerized NestJS)
- **Database:** MongoDB Atlas (M0 free tier → M2 production)
- **Client:** Expo EAS Build → APK distribution

---

**Previous:** [← Requirements](02-requirements.md) | **Next:** [Implementation →](04-implementation.md)

## Services

### Mobile Client (React Native + Expo)

- **UI Framework:** React Native with NativeWind (Tailwind CSS)
- **State:** Apollo Client (server) + Zustand (global UI)
- **Navigation:** Expo Router
- **ML:** TensorFlow Lite for on-device inference

### Backend API (NestJS + GraphQL)

- **Framework:** NestJS with Apollo Server
- **Database:** Prisma ORM with MongoDB
- **Auth:** JWT with Passport
- **Caching:** DataLoader for N+1 prevention

### AI Services

- **Ollama:** Local LLM runtime for waste analysis
- **LLM API:** FastAPI wrapper for structured recycling guidance

### Infrastructure

- **Database:** MongoDB with replica set
- **Cache:** Redis for performance
- **Monitoring:** Statping dashboard
- **Deployment:** Docker Compose

## Data Flow

1. **Mobile** captures image → **TensorFlow Lite** classifies waste
2. **Mobile** sends result → **Backend** processes via GraphQL
3. **Backend** calls **LLM Service** → **Ollama** provides guidance
4. **Backend** awards points → **MongoDB** updates user profile
5. **Redis** caches frequent queries

## Key Technologies

- **Frontend:** React Native, Expo, Apollo Client
- **Backend:** NestJS, GraphQL, Prisma, MongoDB
- **AI/ML:** TensorFlow Lite, Ollama, Python FastAPI
- **Infrastructure:** Docker, Redis, Firebase, Google Maps
- **DevOps:** pnpm monorepo, ESLint, Prettier
