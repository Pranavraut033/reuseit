# ReuseIt Backend

This is the backend codebase for the ReuseIt platform, built with [NestJS](https://nestjs.com/), [GraphQL](https://graphql.org/), and [Prisma ORM](https://www.prisma.io/) for MongoDB.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Development](#development)
- [Database & Prisma](#database--prisma)
- [GraphQL Playground](#graphql-playground)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

- GraphQL API (Apollo)
- MongoDB with Prisma ORM
- JWT authentication (Google Sign-In supported)
- Modular NestJS structure (User, Post, Event, etc.)
- Prisma schema auto-generation
- E2E and unit testing
- Google Maps integration (Places, Autocomplete, Reverse Geocoding) via backend GraphQL
- AI-powered waste analysis integration (connects to llm-service microservice)

---

## Requirements

- Node.js v18+
- Yarn or npm
- MongoDB (local or remote, replica set required for transactions)
- [NestJS CLI](https://docs.nestjs.com/cli/overview) (optional, for development)

---

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**

   Create a `.env` file in `/backend` with:

   ```
   DATABASE_URL=mongodb://localhost:27017/reuseit
   JWT_SECRET=your_jwt_secret
  GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

   Adjust `DATABASE_URL` as needed.

---

## Database & Prisma

- **Prisma schema:** See [`prisma/schema.prisma`](./prisma/schema.prisma)
- **Generate Prisma Client:**

  ```bash
  npx prisma generate
  ```

- **MongoDB Replica Set:**
  MongoDB must run as a replica set for Prisma transactions to work.

- **Create 2dsphere index for geospatial queries:**

  ```bash
  node scripts/createGeoIndex.js
  ```

---

## Development

- **Start the backend server:**

  ```bash
  npm run start:dev
  # or
  yarn start:dev
  ```

- **Build for production:**

  ```bash
  npm run build
  ```

- **Start production server:**

  ```bash
  npm run start:prod
  ```

---

## GraphQL Playground

- Once running, access the GraphQL Playground at:
  `http://localhost:3000/graphql`

  ### Google Maps Queries

  The `GoogleMapsModule` provides cached Google Maps features so the mobile app no longer calls Google APIs directly:

  | Query | Arguments | Description |
  |-------|-----------|-------------|
  | `placesAutocomplete` | `input` (String!), optional `latitude`, `longitude`, `radius`, `sessionToken` | Returns place predictions near optional location bias. |
  | `placeDetails` | `placeId` (String!), optional `sessionToken` | Returns detailed place info (name, coordinates, address components). |
  | `nearbyPlaces` | `latitude` (Float!), `longitude` (Float!), optional `radius`, `keywords` ([String!]!) | Aggregates nearby places matching any keyword (deduplicated). |
  | `reverseGeocode` | `latitude` (Float!), `longitude` (Float!) | Converts coordinates to structured address. |
  | `generatePlacesSessionToken` | — | Returns a random token for grouping billing sessions. |

  Caching TTLs (approx): Autocomplete 60s, Place Details 300s, Nearby 120s, Reverse Geocode 600s.


---

## Testing

- **Run all tests:**

  ```bash
  npm run test
  ```

- **Run E2E tests:**

  ```bash
  npm run test:e2e
  ```

---

## Deployment

- Ensure all environment variables are set in production.
- Use `npm run build` and `npm run start:prod` for deployment.

## Docker

You can build and run the backend together with a MongoDB container using Docker.

Recommended: in `/backend` run:

```bash
# build the backend image
docker compose build

# start mongo + backend
docker compose up -d
```

The compose file exposes the API on port 3000. A default DATABASE_URL is provided in `docker-compose.yml`:

```
DATABASE_URL=mongodb://root:example@mongo:27017/reuseit?authSource=admin
```

Notes:
- The image uses a multi-stage Dockerfile (`Dockerfile`) that installs dependencies, runs `prisma generate`, and builds the NestJS app.
- The compose file creates a `mongo` service (MongoDB 6) with a persistent volume `mongo-data`.
- If you want to run in development mode with live reload, avoid the production image and mount your source (or run `yarn start:dev` on your host).

Config tips:
- To use your own credentials, set the `DATABASE_URL` environment variable before running `docker compose up`, or override the `environment` section in `docker-compose.yml`.
- Prisma requires MongoDB to be running as a replica set for transactions. For simple local development without transactions you can use the single-node MongoDB instance in this compose file, but enable replica set in production or follow MongoDB docs to init a replica set.

---

## Troubleshooting

- **MongoDB Transactions:**
  Ensure MongoDB is running as a replica set for Prisma transactions.

- **Geo Index:**
  Run `node scripts/createGeoIndex.js` after setting up the database.

---

## Scripts

- `scripts/createGeoIndex.js`: Creates a 2dsphere index on the `Location` collection for geospatial queries.

---

## License

This project is private and not licensed for external use.

---
