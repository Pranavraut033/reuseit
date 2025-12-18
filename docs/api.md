# API

The backend exposes a GraphQL API using NestJS and Apollo Server.

## GraphQL Endpoint

- **URL**: `http://localhost:3000/graphql` (development)
- **Playground**: Interactive GraphQL interface available at the endpoint

## Schema

The authoritative GraphQL schema is generated from the Prisma schema and available at `apps/backend/prisma/schema.gql`.

## Client Code Generation

After backend schema changes, regenerate TypeScript types:

```bash
pnpm --filter mobile run codegen
```

## Authentication

API requests require JWT authentication via Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

**Last Updated**: December 2025
