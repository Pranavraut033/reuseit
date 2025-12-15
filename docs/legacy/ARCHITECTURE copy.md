# System Architecture

This document provides a comprehensive overview of the ReUseIt application architecture, including component relationships, data flow, and key design decisions.

---

## Architecture Overview

ReUseIt employs a modern, cloud-based architecture designed for scalability, maintainability, and optimal performance. The system follows a layered architecture pattern with clear separation of concerns.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Client Layer                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React Native (Expo) - Cross Platform           │ │
│  │                                                         │ │
│  │  • Apollo Client (State Management & Caching)          │ │
│  │  • TensorFlow Lite (On-Device ML)                      │ │
│  │  • Google Maps SDK (Location Services)                 │ │
│  │  • Firebase SDK (Auth & Push Notifications)            │ │
│  │  • NativeWind (Tailwind CSS for styling)               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/GraphQL
                              │ (Data Flow)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      NestJS + Apollo GraphQL Server                    │ │
│  │                                                         │ │
│  │  Modules:                                               │ │
│  │  • Authentication (JWT/OAuth2)                          │ │
│  │  • User Management                                      │ │
│  │  • Content Management (Articles, Guides)                │ │
│  │  • Community (Posts, Comments)                          │ │
│  │  • Event Management                                     │ │
│  │  • Gamification (Points, Badges, Leaderboards)          │ │
│  │  • Location Services                                    │ │
│  │  • Notification Service (Firebase FCM)                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              │ (Type-Safe Data Access)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              MongoDB Atlas (Cloud Database)            │ │
│  │                                                         │ │
│  │  Collections:                                           │ │
│  │  • Users, Profiles                                      │ │
│  │  • Posts, Comments, Likes                               │ │
│  │  • Events, Registrations                                │ │
│  │  • Badges, Leaderboards, Points                         │ │
│  │  • Articles, Guides                                     │ │
│  │  • Locations, Check-ins                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              External Services & Infrastructure              │
│                                                              │
│  • Firebase (Authentication & Push Notifications)            │
│  • Google Maps Platform (Geolocation & Mapping)              │
│  • TensorFlow Lite (On-Device ML Inference)                  │
│  • GitHub Actions (CI/CD Pipeline)                           │
│  • Cloud Storage (Media & Assets)                            │
└─────────────────────────────────────────────────────────────┘
```

**Notation Legend:**

- **Solid arrows (│):** Represent direct data flow and communication
- **Data Flow direction:** Top to bottom (client → server → database)
- **Control Flow:** Bidirectional - requests flow down, responses flow up
- **External Services:** Integrated at appropriate layers

---

## Layer Descriptions

### 1. Mobile Client Layer (React Native)

**Purpose:** Provides the user interface and client-side application logic.

**Components:**

- **React Native Framework:** Cross-platform mobile development
- **Expo SDK:** Simplified development tooling and native API access
- **Apollo Client:** GraphQL client with intelligent caching
- **TensorFlow Lite:** On-device machine learning inference
- **Google Maps SDK:** Location services and mapping
- **Firebase SDK:** Authentication and push notifications
- **NativeWind:** Utility-first styling with Tailwind CSS

**Responsibilities:**

- Render UI components and handle user interactions
- Manage local application state
- Execute on-device ML inference for image recognition
- Cache data for offline functionality
- Handle push notifications
- Communicate with backend via GraphQL

**Data Flow:**

1. User interactions trigger UI events
2. Events dispatched to appropriate handlers
3. GraphQL queries/mutations sent to backend
4. Responses cached locally via Apollo Client
5. UI updated reactively based on state changes

---

### 2. Backend API Layer (NestJS + GraphQL)

**Purpose:** Handles business logic, data validation, and orchestrates communication between the client and database.

**Components:**

#### Core Framework

- **NestJS:** Modular, TypeScript-first backend framework
- **Apollo Server:** GraphQL server implementation
- **Express:** Underlying HTTP server

#### Modules

**Authentication Module**

- User registration and login
- JWT token generation and validation
- OAuth2 integration (Google)
- Password hashing with bcrypt
- Session management

**User Module**

- Profile management (CRUD operations)
- Statistics calculation
- Preferences management
- Privacy settings

**Content Module**

- Article and guide management
- Search and filtering
- Content categorization
- Bookmarking system

**Community Module**

- Post creation and management
- Comment system
- Like/unlike functionality
- User interactions

**Event Module**

- Event creation and editing
- Registration management
- Check-in verification
- Participant tracking

**Gamification Module**

- Points calculation and tracking
- Badge assignment logic
- Leaderboard generation
- Achievement system

**Location Module**

- Recycling center data management
- Proximity search
- Check-in verification
- Location-based filtering

**Notification Module**

- Push notification dispatch (via Firebase FCM)
- In-app notification management
- Notification preferences
- Event reminders

**Responsibilities:**

- Validate and sanitize all incoming data
- Enforce authentication and authorization
- Execute business logic and rules
- Coordinate database operations
- Integrate with external services
- Return properly formatted responses

**Data Flow:**

1. GraphQL requests received from client
2. Authentication middleware validates JWT tokens
3. Resolvers execute appropriate business logic
4. Prisma ORM queries database
5. Response formatted and returned to client

---

### 3. Database Layer (MongoDB Atlas)

**Purpose:** Persistent storage of all application data.

**Technology:**

- **MongoDB:** NoSQL document database
- **Prisma ORM:** Type-safe database client
- **MongoDB Atlas:** Cloud-hosted database service

**Collections:**

#### Users Collection

```typescript
{
  id: string;
  email: string;
  password: string(hashed);
  name: string;
  profilePhoto: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Posts Collection

```typescript
{
  id: string
  authorId: string
  title: string
  description: string
  images: string[]
  type: enum ('DONATION', 'REQUEST')
  location: GeoJSON
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Events Collection

```typescript
{
  id: string;
  organizerId: string;
  title: string;
  description: string;
  location: GeoJSON;
  startDate: DateTime;
  endDate: DateTime;
  maxParticipants: number;
  currentParticipants: number;
}
```

#### Gamification Collections

- **Points:** User point transactions and totals
- **Badges:** Badge definitions and user assignments
- **Leaderboards:** Ranked user lists by various metrics

**Indexing Strategy:**

- Geographic indexes on location fields for proximity queries
- Text indexes on searchable fields (title, description)
- Compound indexes on frequently queried field combinations
- TTL indexes for temporary data (sessions, tokens)

**Responsibilities:**

- Store and retrieve application data
- Enforce data integrity constraints
- Provide efficient query execution
- Handle geospatial queries
- Manage data replication and backups

---

## External Services Integration

### Firebase

**Authentication:**

- OAuth2 provider integration
- Token validation
- User credential management

**Cloud Messaging (FCM):**

- Push notification delivery
- Device token management
- Message queuing

**Cloud Storage:**

- User-uploaded images
- Profile photos
- Event images

### Google Maps Platform

**Geocoding API:**

- Convert addresses to coordinates
- Reverse geocoding for location names

**Maps SDK:**

- Interactive map display
- Custom markers and overlays
- User location tracking

**Directions API:**

- Turn-by-turn navigation
- Route optimization
- Distance calculations

### TensorFlow Lite

**Model Deployment:**

- Pre-trained MobileNet model
- On-device inference
- Real-time classification

**Benefits:**

- Privacy (no data sent to servers)
- Offline functionality
- Fast inference (<3s)

---

## Key Architecture Decisions

### 1. GraphQL over REST

**Rationale:**

- Eliminates over-fetching and under-fetching of data
- Single endpoint simplifies API management
- Strong typing with schema definitions
- Real-time capabilities with subscriptions (planned)
- Better developer experience with self-documenting API

**Trade-offs:**

- Slightly steeper learning curve
- More complex caching strategies
- Requires careful query optimization

### 2. Modular NestJS Backend

**Rationale:**

- Clear separation of concerns
- Independent module testing
- Easy to scale and maintain
- Dependency injection for loose coupling
- Built-in support for GraphQL

**Trade-offs:**

- More initial boilerplate
- Potential over-engineering for simple features

### 3. Prisma ORM

**Rationale:**

- Type-safe database access
- Automatic migration generation
- Excellent TypeScript integration
- Visual schema management
- Works well with MongoDB

**Trade-offs:**

- Additional abstraction layer
- Learning curve for Prisma-specific syntax

### 4. On-Device ML with TensorFlow Lite

**Rationale:**

- Privacy-first approach (no image data transmission)
- Works offline without network
- Faster inference (no network latency)
- Reduced server costs

**Trade-offs:**

- Larger app bundle size
- Device performance dependency
- Model updates require app updates

### 5. MongoDB Atlas (Cloud-First)

**Rationale:**

- Managed service reduces operational overhead
- Global distribution for low latency
- Automatic backups and scaling
- Built-in security features
- Excellent geospatial query support

**Trade-offs:**

- Vendor lock-in
- Ongoing costs based on usage
- Less control over infrastructure

### 6. Microservices-Ready Architecture

**Rationale:**

- Modular structure allows future decomposition
- Each module can be scaled independently
- Team can work on modules in parallel
- Easier to adopt new technologies per service

**Current State:**

- Monolithic deployment for simplicity
- Modules designed for future extraction
- Clear boundaries between domains

---

## Data Flow Examples

### Example 1: User Creates a Post

```
1. User fills out post form on mobile app
2. Mobile app validates input locally
3. GraphQL mutation sent to backend:
   mutation CreatePost($input: CreatePostInput!) {
     createPost(input: $input) { id, title, author { name } }
   }
4. Backend authentication middleware validates JWT
5. Post resolver calls PostService.create()
6. PostService validates business rules
7. Prisma creates record in MongoDB
8. Response returned to client
9. Apollo Client updates local cache
10. UI reflects new post immediately
11. Notification sent to nearby users (async)
```

### Example 2: Image Recognition Flow

```
1. User opens camera in app
2. User captures photo of item
3. Image processed locally by TensorFlow Lite model
4. Model returns predictions with confidence scores
5. Top prediction displayed to user
6. User can request recycling instructions
7. GraphQL query fetches instructions from backend
8. Instructions displayed with identification result
9. Action logged for gamification points (sent to backend)
```

### Example 3: Event Check-In

```
1. User arrives at event location
2. User taps "Check In" button
3. App verifies GPS location matches event location
4. GraphQL mutation sent to backend
5. Backend validates:
   - User is registered for event
   - Event is currently active
   - Location is within acceptable radius
6. Check-in record created in database
7. Points awarded to user's account
8. Achievement checked (e.g., "10th Event Attended")
9. Push notification sent if badge unlocked
10. UI updated with confirmation and points earned
```

---

## Security Architecture

### Authentication Flow

```
1. User enters credentials
2. Frontend hashes password (client-side validation)
3. Credentials sent over HTTPS to backend
4. Backend validates and hashes password (bcrypt)
5. JWT access token generated (short-lived, 15 min)
6. JWT refresh token generated (long-lived, 7 days)
7. Tokens returned to client
8. Access token stored in memory
9. Refresh token stored in secure storage
10. Access token included in GraphQL request headers
```

### Authorization Layers

1. **Network Layer:** HTTPS/TLS encryption
2. **API Gateway:** Rate limiting, DDoS protection
3. **Authentication:** JWT validation on every request
4. **Authorization:** Role-based access control (RBAC)
5. **Data Layer:** Field-level permissions

---

## Performance Optimizations

### Client-Side

- Apollo Client caching reduces redundant requests
- Lazy loading of images and components
- Optimized bundle size with code splitting
- On-device ML eliminates network latency

### Backend

- Database query optimization with proper indexing
- GraphQL DataLoader for batching and caching
- Response compression (gzip)
- Connection pooling for database

### Database

- Geospatial indexes for location queries
- Compound indexes for common query patterns
- Read replicas for read-heavy operations (planned)
- Aggregation pipeline optimization

---

## Scalability Considerations

### Horizontal Scaling

- Stateless backend allows multiple instances
- Load balancer distributes traffic
- Database sharding for large datasets (future)

### Vertical Scaling

- Cloud infrastructure allows resource upgrades
- MongoDB Atlas auto-scales based on load

### Caching Strategy

- Apollo Client cache on mobile
- Redis cache for backend (planned)
- CDN for static assets

---

## Monitoring & Observability

### Metrics Tracked

- API response times
- Error rates
- Database query performance
- User engagement metrics
- System resource usage

### Tools (Planned)

- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Analytics (Mixpanel or similar)
- Server monitoring (DataDog or similar)

---

_Last Updated: November 2025_
