# 6. Installation & Operation Manual

## 6.1 Prerequisites

Ensure the following software is installed:

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8.x or higher | `npm install -g pnpm` |
| **Docker** | 24.x or higher | [docker.com](https://www.docker.com/) |
| **Docker Compose** | 2.x or higher | Included with Docker Desktop |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

**Optional (for mobile development):**
- **Android Studio** (for Android emulator)
- **Xcode** (macOS only, for iOS simulator)
- **Expo Go app** (on physical device)

**Note:** The project uses Docker Compose for all services in development and production. Local MongoDB installation is optional but not required.

---

## 6.2 Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/Pranavraut033/reuseit.git
cd reuseit
```

---

### Step 2: Install Dependencies

From the root directory:

```bash
pnpm install
```

This installs all packages for both backend and mobile apps.

---

### Step 3: Environment Configuration

Create root `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB Configuration
MONGO_USERNAME="admin"
MONGO_PASSWORD="admin123"
MONGO_DATABASE="reuseit"
DATABASE_URL="mongodb://admin:admin123@mongodb:27017/reuseit?authSource=admin&replicaSet=rs0"

# Backend Configuration
JWT_SECRET="your-jwt-secret-here"
FIREBASE_PROJECT_ID="reuseit-a37ea"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@reuseit-a37ea.iam.gserviceaccount.com"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Service Ports (optional, defaults provided)
BACKEND_PORT="3000"
OLLAMA_PORT="11434"
LLM_PORT="8000"
STATPING_PORT="8080"
```

**Note:** For development, you can use the default values. For production, generate secure passwords and secrets.

---

### Step 4: Database Setup

**MongoDB is automatically configured via Docker Compose.** The database will be initialized when you start the services.

After starting services (Step 5), run migrations:

```bash
# Wait for services to be healthy, then run:
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate:dev
```

**Optional:** For local MongoDB development (without Docker):

#### Local MongoDB Setup

**1. Install and start MongoDB:**

```bash
# macOS (using Homebrew)
brew install mongodb-community
mongod --replSet rs0 --dbpath ~/data/db

# Initialize replica set in another terminal:
mongosh
> rs.initiate()
```

**2. Update DATABASE_URL in `.env`:**

```env
DATABASE_URL="mongodb://localhost:27017/reuseit?replicaSet=rs0"
```

**3. Run migrations as above.**

---

### Step 5: Seed Database (Optional)

Populate with sample data:

```bash
cd apps/backend
pnpm prisma:seed
```

This creates:
- 10 sample users
- 20 articles
- 15 posts
- 5 events
- 3 recycling centers

---

### Step 5: Start All Services

**Primary Method: Docker Compose (Recommended)**

```bash
# Start all services
docker-compose up -d

# Wait 2-3 minutes for services to initialize
# Check status: docker-compose ps
```

This starts:
- **MongoDB** (database) on port 27017
- **Redis** (cache) on port 6379
- **Backend** (NestJS API) on port 3000
- **Ollama** (LLM runtime) on port 11434
- **LLM Service** (AI analysis) on port 8000
- **Statping** (monitoring) on port 8080

**Verify services are running:**
```bash
docker-compose logs -f
```

**Expected Output:** All containers should show "healthy" status.

---

### Start Mobile App (Local Development)

**Note:** Mobile app runs locally for development (not in Docker).

```bash
# Install dependencies (if not done)
pnpm install

# Configure mobile environment
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env`:

```env
# Backend API (connects to Docker backend)
EXPO_PUBLIC_API_URL="http://localhost:3000/graphql"

# For Android Emulator: http://10.0.2.2:3000/graphql
# For physical device: http://[your-ip]:3000/graphql

# Firebase configuration
EXPO_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="project-id.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="project-id"

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

**Start mobile development server:**

```bash
pnpm --filter mobile run start
```

**Expected Output:**

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

### Alternative: Local Backend Development

If you prefer running backend locally (without Docker):

```bash
# Install dependencies
pnpm install

# Setup Python environments for ML services
cd apps/ml-training
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

cd ../llm-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Configure backend environment
cp apps/backend/.env.example apps/backend/.env
# Edit with local DATABASE_URL: mongodb://localhost:27017/reuseit?replicaSet=rs0

# Start local MongoDB (see Step 4)
# Then run migrations
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate:dev

# Start backend
pnpm --filter backend run start:dev
```

**Note:** This method requires manual setup of MongoDB, Redis, and Ollama locally.

---

## 6.4 Verification Checklist

After starting services, verify:

- [ ] **Docker Services Running:** `docker-compose ps` shows all containers healthy
- [ ] **Backend API:** http://localhost:3000/graphql (GraphQL Playground)
- [ ] **LLM Service:** http://localhost:8000/docs (FastAPI docs)
- [ ] **Ollama API:** http://localhost:11434/api/tags (model list)
- [ ] **Statping Monitoring:** http://localhost:8080 (status dashboard)
- [ ] **Mobile App:** Displays login screen and connects to backend
- [ ] **Database:** Can register user and view data
- [ ] **Camera:** Permission prompt appears (on device/simulator)

---

## 6.5 Common Tasks

### Docker Management

```bash
# View service logs
docker-compose logs -f

# View service status
docker-compose ps

# Restart specific service
docker-compose restart backend

# Rebuild and restart service
docker-compose up -d --build backend

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Database Management

```bash
# Open Prisma Studio (visual database editor)
pnpm --filter backend run prisma:studio

# Create new migration
pnpm --filter backend run prisma:migrate dev --name <migration-name>

# Reset database (⚠️ deletes all data)
pnpm --filter backend run prisma:migrate reset

# Generate Prisma client
pnpm --filter backend run prisma:generate
```

### Mobile Development

```bash
# Generate GraphQL types after backend changes
pnpm --filter mobile run codegen

# Clear Expo cache
pnpm --filter mobile run start --clear
```

---

### Building for Production

#### Backend Build

```bash
cd apps/backend
pnpm build
pnpm start:prod
```

#### Mobile Build (Android APK)

```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

APK download link will be provided after build completes (~10 minutes).

---

## 6.6 Troubleshooting

### Docker Issues

#### Services Not Starting

**Error:** `docker-compose up` fails

**Solution:**
1. Ensure Docker Desktop is running
2. Check available disk space: `docker system df`
3. Clear Docker cache: `docker system prune -a`
4. Restart Docker Desktop

#### Port Conflicts

**Error:** `Port already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process or change port in .env
BACKEND_PORT="3001"
```

#### MongoDB Replica Set Issues

**Error:** MongoDB unhealthy

**Solution:**
```bash
# Reset MongoDB
docker-compose down -v
docker-compose up -d mongodb

# Wait for initialization, then restart other services
docker-compose up -d
```

### Backend Issues

#### GraphQL Playground Not Loading

**Error:** `Cannot GET /graphql`

**Solution:**
1. Verify backend is running: `docker-compose logs backend`
2. Check port: `curl http://localhost:3000/health`
3. Restart backend: `docker-compose restart backend`

#### Database Connection Error

**Error:** `MongooseServerSelectionError`

**Solution:**
1. Ensure MongoDB is healthy: `docker-compose ps`
2. Check DATABASE_URL in `.env`
3. Verify replica set: `docker-compose exec mongodb mongosh --eval "rs.status()"`

### Mobile Issues

#### Cannot Connect to Backend

**Error:** `Network request failed`

**Solution:**

**On Android Emulator:**
```env
EXPO_PUBLIC_API_URL="http://10.0.2.2:3000/graphql"
```

**On Physical Device:**
```env
# Find your computer's IP
EXPO_PUBLIC_API_URL="http://192.168.1.100:3000/graphql"
```

Ensure device and computer are on same WiFi.

#### Camera Not Working

**Error:** `Camera permission denied`

**Solution:**
- iOS Simulator: Use physical device (simulator has no camera)
- Android Emulator: Enable camera in AVD settings
- Physical Device: Grant camera permission in app settings

### LLM Service Issues

#### Ollama Model Not Available

**Error:** Waste analysis fails

**Solution:**
1. Check Ollama logs: `docker-compose logs ollama`
2. Verify model pulled: `curl http://localhost:11434/api/tags`
3. Restart services: `docker-compose restart ollama llm-service`

### Legacy Issues (Local Development)

#### Local MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running: `mongod --replSet rs0`
2. Verify replica set initialized: `mongosh` → `rs.status()`
3. Check `DATABASE_URL` in `.env`

#### Local GraphQL Playground Not Loading

**Error:** `Cannot GET /graphql`

**Solution:**
1. Verify backend is running: `pnpm --filter backend run start:dev`
2. Check port 3000 is not in use: `lsof -i :3000`
3. Clear browser cache

#### Prisma Generate Fails

**Error:** `Error: Generator "client" does not exist`

**Solution:**
```bash
cd apps/backend
pnpm install
pnpm prisma:generate
```

---

## 6.7 Development Workflow

**Typical Developer Session (Docker):**

```bash
# Start all services
docker-compose up -d

# Terminal 1: Mobile development
pnpm --filter mobile run start

# Terminal 2: Backend logs (optional)
docker-compose logs -f backend

# Terminal 3: Database management
pnpm --filter backend run prisma:studio

# Make code changes → backend auto-restarts in Docker
# Run tests before committing
pnpm --filter backend run test
```

**Alternative: Local Development**

```bash
# Terminal 1: Backend
pnpm --filter backend run start:dev

# Terminal 2: Mobile
pnpm --filter mobile run start

# Terminal 3: Database
pnpm --filter backend run prisma:studio
```

---

## 6.8 Environment Variables Reference

### Root `.env` (Docker Services)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_USERNAME` | ⚠️ | MongoDB admin username (default: admin) |
| `MONGO_PASSWORD` | ⚠️ | MongoDB admin password (default: admin123) |
| `MONGO_DATABASE` | ⚠️ | Database name (default: reuseit) |
| `DATABASE_URL` | ✅ | Full MongoDB connection string |
| `REDIS_URL` | ⚠️ | Redis connection URL (default: redis://redis:6379) |
| `BACKEND_PORT` | ⚠️ | Backend service port (default: 3000) |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase service account key |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase service account email |
| `GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API key |
| `OLLAMA_PORT` | ⚠️ | Ollama service port (default: 11434) |
| `LLM_PORT` | ⚠️ | LLM service port (default: 8000) |
| `STATPING_PORT` | ⚠️ | Statping monitoring port (default: 8080) |

### Mobile `.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | ✅ | Backend GraphQL endpoint |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API key |

---

## 6.9 Quick Reference Commands

```bash
# Installation
git clone https://github.com/Pranavraut033/reuseit.git
cd reuseit-mono
cp .env.example .env
docker-compose up -d

# Development
docker-compose up -d              # Start all services
pnpm --filter mobile run start     # Start mobile dev server
docker-compose logs -f             # View service logs
docker-compose restart backend     # Restart backend

# Database
pnpm --filter backend run prisma:studio
pnpm --filter backend run prisma:migrate:dev
pnpm --filter backend run prisma:generate

# Mobile
pnpm --filter mobile run codegen   # Generate GraphQL types

# Testing
pnpm --filter backend run test
pnpm lint && pnpm format

# Production Build
pnpm --filter backend run build
eas build --platform android
```

### Service URLs

- **Backend API**: http://localhost:3000/graphql
- **Waste Analysis**: http://localhost:8000/docs
- **Ollama API**: http://localhost:11434
- **Monitoring**: http://localhost:8080
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

---

## 6.10 Production Deployment

The Docker setup can be used for production with some additional considerations.

### Security Hardening

1. **Change Default Passwords:**
   - Update `MONGO_USERNAME` and `MONGO_PASSWORD`
   - Generate secure `JWT_SECRET`
   - Use strong Firebase service account keys

2. **Environment Variables:**
   - Set `NODE_ENV=production` in backend service
   - Configure proper CORS origins
   - Use production Firebase and Google Maps keys

3. **Network Security:**
   - Don't expose MongoDB/Redis ports publicly
   - Use reverse proxy (nginx) for SSL termination
   - Configure firewall rules

### Scaling Considerations

- **MongoDB:** Use MongoDB Atlas for managed replica sets
- **Redis:** Use managed Redis service (AWS ElastiCache, etc.)
- **Ollama:** Consider GPU instances for better LLM performance
- **Backend:** Scale horizontally with load balancer

### Monitoring & Maintenance

- **Statping:** Access at http://localhost:8080 for service monitoring
- **Logs:** Use `docker-compose logs` or centralized logging
- **Backups:** Regular MongoDB backups and volume snapshots
- **Updates:** Monitor for Docker image updates and security patches

### Docker Commands for Production

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild specific service
docker-compose up -d --build backend

# View running containers
docker-compose ps

# Clean up (removes stopped containers)
docker-compose down --remove-orphans
```

---

**Previous:** [← Testing](05-testing.md) | **Next:** [API Reference →](07-api-reference.md)
