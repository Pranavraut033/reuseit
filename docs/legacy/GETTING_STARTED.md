# Getting Started with ReUseIt

This guide will help you set up and run the ReUseIt application on your local development machine.

---

## Prerequisites

Ensure you have the following installed on your development machine:

### Required Software

#### 1. Node.js (v18.x or higher)
Download and install from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
# Should output v18.x.x or higher
```

#### 2. pnpm (v8.x or higher)
Fast, efficient package manager

Install globally:
```bash
npm install -g pnpm
```

Verify installation:
```bash
pnpm --version
# Should output 8.x.x or higher
```

#### 3. MongoDB (v5.x or higher)

**Option A: Local Installation**
- Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- Follow installation instructions for your operating system

**Option B: Cloud (Recommended for beginners)**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Set up a free cluster
- Get your connection string

#### 4. Expo CLI
For React Native development

Install globally:
```bash
npm install -g expo-cli
```

Verify installation:
```bash
expo --version
```

#### 5. Development Tools

**For iOS Development (macOS only):**
- Xcode (latest version from Mac App Store)
- Xcode Command Line Tools
- iOS Simulator

**For Android Development:**
- Android Studio
- Android SDK
- Android Emulator or physical device

---

## Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/reuseit.git
cd reuseit
```

### Step 2: Install Dependencies

From the root directory:

```bash
pnpm install
```

This will install all dependencies for both backend and mobile applications.

---

## MongoDB Setup

### Option 1: Local MongoDB with Replica Set

Prisma requires MongoDB to run as a replica set for transaction support.

#### 1. Create Data Directory

```bash
mkdir -p ~/data/db
```

#### 2. Start MongoDB with Replica Set

```bash
mongod --replSet rs0 --dbpath ~/data/db --bind_ip localhost
```

Keep this terminal window open.

#### 3. Initialize Replica Set

In a new terminal window:

```bash
mongosh --eval "rs.initiate()"
```

#### 4. Verify Replica Set Status

```bash
mongosh --eval "rs.status()"
```

You should see status information showing your replica set is active.

#### 5. Connection String Format

```
mongodb://localhost:27017/reuseit?replicaSet=rs0
```

### Option 2: MongoDB Atlas (Cloud)

#### 1. Create Account
- Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Sign up for a free account

#### 2. Create Cluster
- Choose "Create a Cluster"
- Select the free tier (M0)
- Choose a region close to you
- Click "Create Cluster"

#### 3. Configure Network Access
- Click "Network Access" in the left sidebar
- Click "Add IP Address"
- Click "Allow Access from Anywhere" (for development only)
- Confirm

#### 4. Create Database User
- Click "Database Access" in the left sidebar
- Click "Add New Database User"
- Choose "Password" authentication
- Set username and password (save these!)
- Grant "Read and write to any database"
- Add user

#### 5. Get Connection String
- Click "Database" in the left sidebar
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string
- Replace `<password>` with your database user password
- Replace `<dbname>` with `reuseit`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/reuseit?retryWrites=true&w=majority
```

---

## Environment Variables Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

Add the following content (adjust values as needed):

```env
# Database
DATABASE_URL="mongodb://localhost:27017/reuseit?replicaSet=rs0"
# OR for MongoDB Atlas:
# DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/reuseit?retryWrites=true&w=majority"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-token-secret-different-from-jwt-secret"
JWT_REFRESH_EXPIRES_IN="30d"

# Google OAuth (optional - can skip for initial setup)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/auth/google/callback"

# Firebase Admin (for notifications - can skip for initial setup)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# Server Configuration
PORT=4000
NODE_ENV="development"

# CORS (allow requests from mobile app)
CORS_ORIGIN="exp://localhost:8081,http://localhost:8081,http://localhost:19006"

# API Keys (optional for initial setup)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### Mobile Environment Variables

Create a `.env` file in the `mobile` directory:

```bash
cd ../mobile
touch .env
```

Add the following content:

```env
# Backend API
EXPO_PUBLIC_API_URL="http://localhost:4000/graphql"

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Firebase Configuration (can skip for initial setup)
EXPO_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
EXPO_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef123456"
```

---

## Database Initialization

### Generate Prisma Client

From the `backend` directory:

```bash
cd backend
pnpm prisma generate
```

This generates the Prisma Client based on your schema.

### Push Schema to Database

```bash
pnpm prisma db push
```

This creates the database collections and indexes.

### (Optional) Seed Database

To populate your database with sample data:

```bash
pnpm prisma db seed
```

---

## Start Development Servers

### Option 1: Start Everything Together (Recommended)

From the root directory:

```bash
pnpm dev
```

This starts both backend and mobile concurrently.

### Option 2: Start Services Individually

**Terminal 1 - Backend Server:**
```bash
cd backend
pnpm start:dev
```

You should see:
```
[Nest] INFO Starting Nest application...
[Nest] INFO GraphQL server running on http://localhost:4000/graphql
```

**Terminal 2 - Mobile App:**
```bash
cd mobile
pnpm start
```

You should see the Expo DevTools with a QR code.

---

## Running the Mobile App

### Option 1: Physical Device (Easiest)

1. Install the **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Ensure your phone and computer are on the same WiFi network

3. Scan the QR code from the terminal with:
   - iOS: Camera app
   - Android: Expo Go app

### Option 2: iOS Simulator (macOS only)

```bash
# From mobile directory
pnpm ios
```

Or press `i` in the Expo terminal.

### Option 3: Android Emulator

```bash
# From mobile directory
pnpm android
```

Or press `a` in the Expo terminal.

---

## Verify Installation

### Test Backend

1. Open your browser to [http://localhost:4000/graphql](http://localhost:4000/graphql)

2. You should see the GraphQL Playground

3. Try a simple query:
```graphql
query {
  health
}
```

Expected response:
```json
{
  "data": {
    "health": "OK"
  }
}
```

### Test Mobile App

1. The app should load on your device/simulator

2. You should see the login/registration screen

3. Try creating a test account:
   - Email: `test@example.com`
   - Password: `TestPass123!`

---

## Common Issues & Solutions

### Issue: MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB is running
- Check your DATABASE_URL is correct
- For local MongoDB, verify replica set is initialized
- For Atlas, check network access allows your IP

### Issue: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process (replace PID with actual process ID)
kill -9 PID
```

### Issue: Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd backend
pnpm prisma generate
```

### Issue: Expo Won't Start

**Error:** `Unable to start server`

**Solution:**
```bash
# Clear Expo cache
cd mobile
rm -rf node_modules
pnpm install
expo start -c
```

### Issue: Can't Connect to Backend from Mobile

**Problem:** Mobile app shows network errors

**Solution:**
1. Ensure backend is running (`http://localhost:4000/graphql` accessible)
2. For physical devices, use your computer's local IP instead of `localhost`
   ```env
   # Find your local IP with: ipconfig getifaddr en0 (macOS) or ipconfig (Windows)
   EXPO_PUBLIC_API_URL="http://192.168.1.XXX:4000/graphql"
   ```
3. Restart the Expo server after changing .env

### Issue: Google Maps Not Showing

**Problem:** Map is blank or shows "For development purposes only"

**Solution:**
- Ensure you have a valid Google Maps API key
- Enable the following APIs in Google Cloud Console:
  - Maps SDK for iOS
  - Maps SDK for Android
  - Geocoding API
  - Places API

---

## Development Tools

### Prisma Studio

Visual database management:

```bash
cd backend
pnpm prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555)

### GraphQL Playground

Interactive API explorer:

Visit [http://localhost:4000/graphql](http://localhost:4000/graphql) when backend is running.

### Expo DevTools

Web-based development interface:

Opens automatically when running `pnpm start` in mobile directory.

---

## Next Steps

Now that you have the application running:

1. **Explore the app** - Try different features
2. **Read the documentation** - Check out other docs in the `/docs` folder
3. **Review the code** - Familiarize yourself with the codebase structure
4. **Make changes** - Try modifying something small
5. **Run tests** - See the TESTING.md guide

---

## Getting Help

- **Documentation:** Check other files in `/docs` folder
- **Issues:** Search or create issues on GitHub
- **Community:** Join discussions on GitHub Discussions

---

*Last Updated: November 2025*
