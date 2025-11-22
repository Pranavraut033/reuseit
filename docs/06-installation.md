# 6. Installation & Operation Manual

## 6.1 Prerequisites

Ensure the following software is installed:

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8.x or higher | `npm install -g pnpm` |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **MongoDB** | 5.x or higher (or Atlas account) | [mongodb.com](https://www.mongodb.com/) |

**Optional (for mobile development):**
- **Android Studio** (for Android emulator)
- **Xcode** (macOS only, for iOS simulator)
- **Expo Go app** (on physical device)

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

#### Backend Configuration

Create `apps/backend/.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/reuseit?replicaSet=rs0"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Server
PORT=4000
NODE_ENV=development

# Firebase (get from Firebase Console)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@project-id.iam.gserviceaccount.com"

# Google Maps (get from Google Cloud Console)
GOOGLE_MAPS_API_KEY="AIza..."

# CORS
CORS_ORIGIN="http://localhost:8081"
```

#### Mobile Configuration

Create `apps/mobile/.env`:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env`:

```env
# Backend API
EXPO_PUBLIC_API_URL="http://localhost:4000/graphql"

# For Android Emulator, use: http://10.0.2.2:4000/graphql
# For iOS Simulator, use: http://localhost:4000/graphql
# For physical device, use your computer's IP: http://192.168.x.x:4000/graphql

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY="AIza..."
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="project-id.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="project-id"

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."
```

---

### Step 4: Database Setup

#### Option A: Local MongoDB (Recommended for Development)

**1. Start MongoDB as Replica Set:**

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
mongod --replSet rs0 --dbpath ~/data/db

# In a new terminal, initialize replica set:
mongosh
> rs.initiate()
```

**2. Run Prisma Migrations:**

```bash
cd apps/backend
pnpm prisma:migrate
pnpm prisma:generate
```

#### Option B: MongoDB Atlas (Cloud)

**1. Create Free Cluster:**
- Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create account and free M0 cluster
- Get connection string

**2. Update `DATABASE_URL` in `.env`:**

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/reuseit?retryWrites=true&w=majority"
```

**3. Run Migrations:**

```bash
cd apps/backend
pnpm prisma:migrate
```

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

## 6.3 Running the Application

### Start Backend

```bash
# From root directory
pnpm --filter backend run start:dev
```

**Expected Output:**

```
[Nest] INFO  [NestApplication] Nest application successfully started
[Nest] INFO  GraphQL server ready at http://localhost:4000/graphql
```

**Verify:** Open `http://localhost:4000/graphql` in browser (GraphQL Playground)

---

### Start Mobile App

**Option 1: Development Server**

```bash
# From root directory
pnpm --filter mobile run start
```

**Expected Output:**

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

**Option 2: Android Emulator**

```bash
pnpm --filter mobile run android
```

**Option 3: iOS Simulator (macOS only)**

```bash
pnpm --filter mobile run ios
```

**Option 4: Physical Device**

1. Install **Expo Go** from App Store/Play Store
2. Scan QR code from terminal
3. App loads automatically

---

## 6.4 Verification Checklist

After starting both services, verify:

- [ ] Backend GraphQL Playground accessible at `http://localhost:4000/graphql`
- [ ] Mobile app displays login screen
- [ ] Can register new user
- [ ] Can view article list
- [ ] Camera permission prompt appears (on device/simulator)

---

## 6.5 Common Tasks

### Database Management

```bash
# Open Prisma Studio (visual database editor)
pnpm --filter backend run prisma:studio

# Create new migration
pnpm --filter backend run prisma:migrate dev --name <migration-name>

# Reset database (⚠️ deletes all data)
pnpm --filter backend run prisma:migrate reset
```

---

### Code Quality

```bash
# Lint all packages
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format all files
pnpm format
```

---

### Testing

```bash
# Backend unit tests
pnpm --filter backend run test

# Backend E2E tests
pnpm --filter backend run test:e2e

# Test coverage report
pnpm --filter backend run test:cov
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

### Issue: MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running: `mongod --replSet rs0`
2. Verify replica set initialized: `mongosh` → `rs.status()`
3. Check `DATABASE_URL` in `.env`

---

### Issue: GraphQL Playground Not Loading

**Error:** `Cannot GET /graphql`

**Solution:**
1. Verify backend is running: `pnpm --filter backend run start:dev`
2. Check port 4000 is not in use: `lsof -i :4000`
3. Clear browser cache

---

### Issue: Expo Cannot Connect to Backend

**Error:** `Network request failed`

**Solution:**

**On Android Emulator:**
```env
EXPO_PUBLIC_API_URL="http://10.0.2.2:4000/graphql"
```

**On Physical Device:**
```env
# Find your computer's IP: ifconfig (macOS/Linux) or ipconfig (Windows)
EXPO_PUBLIC_API_URL="http://192.168.1.100:4000/graphql"
```

Ensure devices are on the same WiFi network.

---

### Issue: Camera Not Working in Simulator

**Error:** `Camera permission denied`

**Solution:**
- iOS Simulator: Camera is not available. Use physical device.
- Android Emulator: Enable camera in AVD settings:
  ```
  Android Studio → AVD Manager → Edit → Advanced Settings → Camera → Webcam
  ```

---

### Issue: Prisma Generate Fails

**Error:** `Error: Generator "client" does not exist`

**Solution:**
```bash
cd apps/backend
pnpm install
pnpm prisma:generate
```

---

## 6.7 Development Workflow

**Typical Developer Session:**

```bash
# Terminal 1: Backend
pnpm --filter backend run start:dev

# Terminal 2: Mobile
pnpm --filter mobile run start

# Terminal 3: Database (optional)
pnpm --filter backend run prisma:studio

# Make code changes → auto-reload happens
# Run tests before committing
pnpm --filter backend run test
```

---

## 6.8 Environment Variables Reference

### Backend `.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret |
| `PORT` | ⚠️ | Server port (default: 4000) |
| `NODE_ENV` | ⚠️ | Environment (development/production) |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase service account key |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase service account email |
| `GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API key |
| `CORS_ORIGIN` | ⚠️ | Allowed CORS origins |

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
cd reuseit && pnpm install

# Development
pnpm --filter backend start:dev    # Start backend
pnpm --filter mobile start          # Start mobile

# Database
pnpm --filter backend prisma:migrate
pnpm --filter backend prisma:studio

# Testing
pnpm --filter backend test
pnpm lint && pnpm format

# Production Build
pnpm --filter backend build
eas build --platform android
```

---

**Previous:** [← Testing](05-testing.md) | **Next:** [API Reference →](07-api-reference.md)
