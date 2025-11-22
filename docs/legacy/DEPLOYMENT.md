# Deployment Guide

This guide covers deploying both the backend API and mobile application to production environments.

---

## Table of Contents

- [Backend Deployment](#backend-deployment)
  - [Railway/Render/Heroku](#railwayrenderheroku)
  - [Docker Deployment](#docker-deployment)
  - [Environment Configuration](#environment-configuration)
- [Mobile App Deployment](#mobile-app-deployment)
  - [iOS Deployment](#ios-deployment)
  - [Android Deployment](#android-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)

---

## Backend Deployment

### Prerequisites

- MongoDB Atlas cluster (or other production database)
- Cloud platform account (Railway, Render, or Heroku)
- Environment variables configured
- Domain name (optional but recommended)

---

### Railway/Render/Heroku

These platforms offer easy deployment with minimal configuration.

#### Option 1: Railway

1. **Create Account**
   - Visit [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Build**
   - Railway auto-detects Node.js
   - Set root directory: `backend`
   - Build command: `pnpm build`
   - Start command: `pnpm start:prod`

4. **Set Environment Variables**
   ```
   DATABASE_URL=mongodb+srv://...
   JWT_SECRET=your-production-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   PORT=4000
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Railway automatically builds and deploys

6. **Get URL**
   - Railway provides a URL: `your-app.railway.app`
   - Configure custom domain if desired

#### Option 2: Render

1. **Create Account**
   - Visit [render.com](https://render.com)
   - Sign up with GitHub

2. **New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   ```
   Name: reuseit-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: pnpm install && pnpm build
   Start Command: pnpm start:prod
   ```

4. **Environment Variables**
   - Add all required environment variables
   - Use Render's secret management

5. **Deploy**
   - Click "Create Web Service"
   - Render builds and deploys automatically

#### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd backend
   heroku create reuseit-backend
   ```

4. **Set Buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

5. **Configure Environment**
   ```bash
   heroku config:set DATABASE_URL=mongodb+srv://...
   heroku config:set JWT_SECRET=your-secret
   heroku config:set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

---

### Docker Deployment

For more control over the deployment environment.

#### 1. Create Dockerfile

Already included in `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 4000

# Start application
CMD ["node", "dist/main"]
```

#### 2. Build Docker Image

```bash
cd backend
docker build -t reuseit-backend:latest .
```

#### 3. Run Container Locally (Test)

```bash
docker run -p 4000:4000 \
  -e DATABASE_URL="mongodb+srv://..." \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  reuseit-backend:latest
```

#### 4. Deploy to Cloud

**Docker Hub:**
```bash
docker tag reuseit-backend:latest yourusername/reuseit-backend:latest
docker push yourusername/reuseit-backend:latest
```

**AWS ECS/Fargate:**
- Create ECS cluster
- Define task definition using your Docker image
- Create service with load balancer
- Configure environment variables in task definition

**Google Cloud Run:**
```bash
# Tag for Google Container Registry
docker tag reuseit-backend:latest gcr.io/your-project/reuseit-backend:latest

# Push to GCR
docker push gcr.io/your-project/reuseit-backend:latest

# Deploy to Cloud Run
gcloud run deploy reuseit-backend \
  --image gcr.io/your-project/reuseit-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### Environment Configuration

#### Production Environment Variables

Create a `.env.production` file (never commit this):

```env
# Database
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/reuseit?retryWrites=true&w=majority"

# Authentication
JWT_SECRET="your-super-secure-64-character-secret-for-production-use-only"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="different-super-secure-secret-for-refresh-tokens"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-prod-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-prod-client-secret"
GOOGLE_CALLBACK_URL="https://api.reuseit.com/auth/google/callback"

# Firebase Admin
FIREBASE_PROJECT_ID="reuseit-prod"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@reuseit-prod.iam.gserviceaccount.com"

# Server
PORT=4000
NODE_ENV="production"

# CORS
CORS_ORIGIN="https://reuseit.com,https://www.reuseit.com"

# Logging
LOG_LEVEL="warn"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Google Maps
GOOGLE_MAPS_API_KEY="your-production-api-key"
```

---

## Mobile App Deployment

### iOS Deployment

#### Prerequisites

- Apple Developer Account ($99/year)
- Mac with Xcode installed
- EAS CLI installed: `npm install -g eas-cli`

#### 1. Configure EAS Build

```bash
cd mobile
eas build:configure
```

This creates `eas.json` (already included in project).

#### 2. Update App Config

Edit `mobile/app.config.js`:

```javascript
export default {
  expo: {
    name: "ReUseIt",
    slug: "reuseit",
    version: "1.0.0",
    ios: {
      bundleIdentifier: "com.yourcompany.reuseit",
      buildNumber: "1.0.0",
    },
    // ... other config
  },
};
```

#### 3. Build for iOS

```bash
# Build for App Store
eas build --platform ios --profile production

# Build for TestFlight (internal testing)
eas build --platform ios --profile preview
```

#### 4. Submit to App Store

```bash
eas submit --platform ios
```

You'll be prompted for:
- Apple ID
- App-specific password
- Bundle identifier

#### 5. App Store Connect

1. Visit [App Store Connect](https://appstoreconnect.apple.com)
2. Fill in app metadata:
   - App name, description, keywords
   - Screenshots (required sizes)
   - Privacy policy URL
   - Support URL
3. Submit for review

---

### Android Deployment

#### Prerequisites

- Google Play Developer Account ($25 one-time fee)
- EAS CLI installed

#### 1. Configure App

Edit `mobile/app.config.js`:

```javascript
export default {
  expo: {
    name: "ReUseIt",
    slug: "reuseit",
    version: "1.0.0",
    android: {
      package: "com.yourcompany.reuseit",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
      ],
    },
    // ... other config
  },
};
```

#### 2. Build APK/AAB

```bash
# Build AAB for Play Store (recommended)
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview
```

#### 3. Submit to Play Store

```bash
eas submit --platform android
```

#### 4. Google Play Console

1. Visit [Google Play Console](https://play.google.com/console)
2. Create new application
3. Fill in store listing:
   - Title, short description, full description
   - Screenshots (required sizes)
   - Feature graphic
   - App icon
4. Set up content rating
5. Complete pricing & distribution
6. Submit for review

---

### Over-the-Air (OTA) Updates

EAS Update allows pushing JavaScript/asset updates without new builds.

#### 1. Configure Updates

```bash
eas update:configure
```

#### 2. Publish Update

```bash
# Publish to production
eas update --branch production --message "Bug fixes and improvements"

# Publish to preview/staging
eas update --branch preview --message "Testing new feature"
```

#### 3. Users Receive Updates

- Updates download automatically on next app launch
- No App Store/Play Store review needed
- Only for JavaScript/assets (not native code)

---

## CI/CD Pipeline

### GitHub Actions Workflow

Already configured in `.github/workflows/`

#### Backend CI/CD

`.github/workflows/backend-ci.yml`:

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: cd backend && pnpm install
      
      - name: Lint
        run: cd backend && pnpm lint
      
      - name: Type check
        run: cd backend && pnpm type-check
      
      - name: Run tests
        run: cd backend && pnpm test:cov
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: |
          # Railway deployment commands
          # Or trigger deployment via webhook
```

#### Mobile CI/CD

```yaml
name: Mobile CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
  pull_request:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd mobile && pnpm install
      
      - name: Lint
        run: cd mobile && pnpm lint
      
      - name: Type check
        run: cd mobile && pnpm type-check
      
      - name: Run tests
        run: cd mobile && pnpm test --coverage

  build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build iOS
        run: cd mobile && eas build --platform ios --non-interactive --no-wait
      
      - name: Build Android
        run: cd mobile && eas build --platform android --non-interactive --no-wait
```

---

## Monitoring

### Application Monitoring

**Recommended Tools:**

1. **Sentry** - Error tracking
   ```bash
   pnpm add @sentry/node @sentry/react-native
   ```

2. **DataDog** - APM and infrastructure monitoring

3. **LogRocket** - Session replay and analytics

### Health Checks

Implement health check endpoints:

```typescript
// backend/src/health/health.controller.ts
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected', // Check DB connection
  };
}
```

### Logging

Use structured logging:

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('AppName');

logger.log('Info message');
logger.error('Error message', trace);
logger.warn('Warning message');
logger.debug('Debug message');
```

---

## Production Checklist

Before going live:

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] HTTPS/SSL configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics configured
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] App Store listings complete
- [ ] Beta testing completed
- [ ] Performance testing done
- [ ] Security audit completed
- [ ] CI/CD pipeline working
- [ ] Monitoring dashboards setup
- [ ] Incident response plan ready

---

*Last Updated: November 2025*
