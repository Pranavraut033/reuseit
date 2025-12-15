# API Documentation

This document provides comprehensive documentation for the ReUseIt GraphQL API.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Schema](#schema)
- [Queries](#queries)
- [Mutations](#mutations)
- [Subscriptions](#subscriptions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The ReUseIt API is built with GraphQL, providing a flexible and efficient way to query and manipulate data.

**Base URL:** `http://localhost:4000/graphql` (development)  
**Production URL:** `https://api.reuseit.com/graphql`

**GraphQL Playground:** Available at the same URL when accessed via browser

---

## Authentication

### JWT Token Authentication

Most operations require authentication via JWT tokens.

#### Headers

```
Authorization: Bearer <your-jwt-token>
```

#### Obtaining Tokens

**Register:**

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    token
    refreshToken
    user {
      id
      email
      name
    }
  }
}

# Variables
{
  "input": {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }
}
```

**Login:**

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    refreshToken
    user {
      id
      email
      name
    }
  }
}

# Variables
{
  "input": {
    "email": "user@example.com",
    "password": "SecurePass123!"
  }
}
```

**Refresh Token:**

```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    token
    refreshToken
  }
}
```

---

## Schema

### Core Types

#### User

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  profilePhoto: String
  bio: String
  points: Int!
  badges: [Badge!]!
  posts: [Post!]!
  events: [Event!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### Post

```graphql
type Post {
  id: ID!
  title: String!
  description: String!
  type: PostType!
  images: [String!]!
  author: User!
  location: Location
  likes: Int!
  comments: [Comment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum PostType {
  DONATION
  REQUEST
}
```

#### Event

```graphql
type Event {
  id: ID!
  title: String!
  description: String!
  organizer: User!
  location: Location!
  startDate: DateTime!
  endDate: DateTime!
  maxParticipants: Int
  currentParticipants: Int!
  participants: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### Badge

```graphql
type Badge {
  id: ID!
  name: String!
  description: String!
  icon: String!
  points: Int!
  unlockedAt: DateTime
}
```

#### Location

```graphql
type Location {
  latitude: Float!
  longitude: Float!
  address: String
  name: String
}
```

---

## Queries

### User Queries

#### Get Current User

```graphql
query Me {
  me {
    id
    email
    name
    profilePhoto
    points
    badges {
      id
      name
      icon
      unlockedAt
    }
  }
}
```

#### Get User by ID

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    profilePhoto
    bio
    points
    badges {
      id
      name
    }
  }
}

# Variables
{
  "id": "user-id-here"
}
```

### Post Queries

#### List Posts

```graphql
query GetPosts($filter: PostFilter, $limit: Int, $offset: Int) {
  posts(filter: $filter, limit: $limit, offset: $offset) {
    id
    title
    description
    type
    images
    author {
      id
      name
      profilePhoto
    }
    likes
    comments {
      id
      content
    }
    createdAt
  }
}

# Variables
{
  "filter": {
    "type": "DONATION",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 10000
    }
  },
  "limit": 20,
  "offset": 0
}
```

#### Get Post by ID

```graphql
query GetPost($id: ID!) {
  post(id: $id) {
    id
    title
    description
    type
    images
    author {
      id
      name
      profilePhoto
    }
    location {
      latitude
      longitude
      address
    }
    likes
    comments {
      id
      content
      author {
        name
      }
      createdAt
    }
    createdAt
  }
}
```

### Event Queries

#### List Events

```graphql
query GetEvents($filter: EventFilter, $limit: Int, $offset: Int) {
  events(filter: $filter, limit: $limit, offset: $offset) {
    id
    title
    description
    organizer {
      id
      name
    }
    location {
      latitude
      longitude
      address
    }
    startDate
    endDate
    maxParticipants
    currentParticipants
  }
}

# Variables
{
  "filter": {
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z"
  },
  "limit": 10
}
```

#### Get Event by ID

```graphql
query GetEvent($id: ID!) {
  event(id: $id) {
    id
    title
    description
    organizer {
      id
      name
      profilePhoto
    }
    location {
      latitude
      longitude
      address
      name
    }
    startDate
    endDate
    maxParticipants
    currentParticipants
    participants {
      id
      name
      profilePhoto
    }
  }
}
```

### Leaderboard Queries

```graphql
query GetLeaderboard($type: LeaderboardType!, $limit: Int) {
  leaderboard(type: $type, limit: $limit) {
    rank
    user {
      id
      name
      profilePhoto
    }
    score
  }
}

# Variables
{
  "type": "GLOBAL",
  "limit": 10
}

enum LeaderboardType {
  GLOBAL
  LOCAL
  FRIENDS
}
```

---

## Mutations

### User Mutations

#### Update Profile

```graphql
mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    id
    name
    bio
    profilePhoto
  }
}

# Variables
{
  "input": {
    "name": "John Updated",
    "bio": "Passionate about recycling!",
    "profilePhoto": "https://..."
  }
}
```

### Post Mutations

#### Create Post

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    description
    type
    author {
      id
      name
    }
  }
}

# Variables
{
  "input": {
    "title": "Free Cardboard Boxes",
    "description": "10 moving boxes available",
    "type": "DONATION",
    "images": ["https://..."],
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY"
    }
  }
}
```

#### Like Post

```graphql
mutation LikePost($postId: ID!) {
  likePost(postId: $postId) {
    id
    likes
  }
}
```

#### Comment on Post

```graphql
mutation CommentOnPost($input: CreateCommentInput!) {
  commentOnPost(input: $input) {
    id
    content
    author {
      name
    }
    createdAt
  }
}

# Variables
{
  "input": {
    "postId": "post-id-here",
    "content": "Great initiative!"
  }
}
```

### Event Mutations

#### Create Event

```graphql
mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    id
    title
    description
    startDate
    endDate
  }
}

# Variables
{
  "input": {
    "title": "Beach Cleanup",
    "description": "Join us for a community beach cleanup",
    "startDate": "2025-12-01T10:00:00Z",
    "endDate": "2025-12-01T14:00:00Z",
    "maxParticipants": 50,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "Santa Monica Beach, CA"
    }
  }
}
```

#### Register for Event

```graphql
mutation RegisterForEvent($eventId: ID!) {
  registerForEvent(eventId: $eventId) {
    success
    message
  }
}
```

#### Check In to Event

```graphql
mutation CheckInToEvent($eventId: ID!, $location: LocationInput!) {
  checkInToEvent(eventId: $eventId, location: $location) {
    success
    pointsEarned
  }
}

# Variables
{
  "eventId": "event-id-here",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

---

## Subscriptions

### Real-Time Updates

```graphql
subscription OnNewPost {
  newPost {
    id
    title
    description
    author {
      name
    }
  }
}

subscription OnEventUpdate($eventId: ID!) {
  eventUpdate(eventId: $eventId) {
    id
    currentParticipants
    maxParticipants
  }
}

subscription OnNotification {
  notification {
    id
    type
    title
    message
    createdAt
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "NOT_FOUND",
        "statusCode": 404
      }
    }
  ]
}
```

### Common Error Codes

| Code                    | Status | Description                                      |
| ----------------------- | ------ | ------------------------------------------------ |
| `UNAUTHENTICATED`       | 401    | No valid authentication token provided           |
| `FORBIDDEN`             | 403    | Authenticated but not authorized for this action |
| `NOT_FOUND`             | 404    | Requested resource not found                     |
| `BAD_USER_INPUT`        | 400    | Invalid input data                               |
| `INTERNAL_SERVER_ERROR` | 500    | Server error                                     |

---

## Rate Limiting

API requests are rate limited to prevent abuse:

**Limits:**

- **Authenticated**: 1000 requests per 15 minutes
- **Unauthenticated**: 100 requests per 15 minutes

**Headers:**

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635724800
```

**Error Response:**

```json
{
  "errors": [
    {
      "message": "Rate limit exceeded",
      "extensions": {
        "code": "RATE_LIMIT_EXCEEDED"
      }
    }
  ]
}
```

---

## Testing the API

### Using GraphQL Playground

1. Start the backend server
2. Open `http://localhost:4000/graphql` in your browser
3. Use the built-in documentation explorer (click "DOCS" on the right)
4. Try queries and mutations interactively

### Using curl

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"{ me { id name email } }"}'
```

### Using Postman/Insomnia

1. Create a new GraphQL request
2. Set URL to `http://localhost:4000/graphql`
3. Add Authorization header
4. Write your query/mutation in the GraphQL tab

---

_Last Updated: November 2025_
