# 7. API Reference

## 7.1 Overview

**Base URL:** `http://localhost:4000/graphql` (development)
**Protocol:** GraphQL over HTTP
**Authentication:** JWT Bearer Token

**GraphQL Playground:** Access via browser at base URL

---

## 7.2 Authentication

### Headers

All authenticated requests require:

```http
Authorization: Bearer <jwt-token>
```

### Obtaining Tokens

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
    user { id email name points }
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

---

## 7.3 Core Schema

### User Type

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  avatar: String
  bio: String
  points: Int!
  badges: [Badge!]!
  posts: [Post!]!
  createdAt: DateTime!
}
```

### Post Type

```graphql
type Post {
  id: ID!
  title: String!
  description: String
  category: Category!
  condition: Condition!
  images: [String!]!
  tags: [String!]!
  location: Location
  author: User!
  likesCount: Int!
  commentsCount: Int!
  createdAt: DateTime!
}

enum Category {
  ELECTRONICS
  FURNITURE
  CLOTHING
  TOYS
  BOOKS
  APPLIANCES
  SPORTS
  OTHER
}

enum Condition {
  NEW
  LIKE_NEW
  GOOD
  FAIR
  POOR
}
```

### Event Type

```graphql
type Event {
  id: ID!
  title: String!
  description: String!
  location: Location!
  startDate: DateTime!
  endDate: DateTime!
  maxParticipants: Int
  participants: [User!]!
  qrCode: String!
  createdAt: DateTime!
}
```

### Location Type

```graphql
type Location {
  type: String!        # Always "Point"
  coordinates: [Float!]! # [longitude, latitude]
  address: String
}
```

---

## 7.4 Queries

### User Queries

**Get Current User:**

```graphql
query Me {
  me {
    id
    email
    name
    points
    badges { id name icon }
  }
}
```

**Get User Profile:**

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    avatar
    bio
    points
    posts { id title }
  }
}
```

**Leaderboard:**

```graphql
query Leaderboard($limit: Int) {
  leaderboard(limit: $limit) {
    id
    name
    avatar
    points
    rank
  }
}

# Variables
{ "limit": 10 }
```

---

### Post Queries

**Get Posts Feed:**

```graphql
query GetPosts($filter: PostFilterInput, $page: Int, $limit: Int) {
  posts(filter: $filter, page: $page, limit: $limit) {
    items {
      id
      title
      description
      images
      author { id name avatar }
      likesCount
      createdAt
    }
    total
    hasMore
  }
}

# Variables
{
  "filter": {
    "category": "ELECTRONICS",
    "condition": "GOOD"
  },
  "page": 1,
  "limit": 20
}
```

**Get Post Details:**

```graphql
query GetPost($id: ID!) {
  post(id: $id) {
    id
    title
    description
    category
    condition
    images
    tags
    location { coordinates address }
    author { id name avatar }
    likesCount
    commentsCount
    comments {
      id
      content
      author { id name avatar }
      createdAt
    }
    createdAt
  }
}
```

**Search Posts:**

```graphql
query SearchPosts($query: String!, $limit: Int) {
  searchPosts(query: $query, limit: $limit) {
    id
    title
    description
    category
  }
}

# Variables
{ "query": "laptop", "limit": 10 }
```

---

### Event Queries

**Get Events:**

```graphql
query GetEvents($filter: EventFilterInput) {
  events(filter: $filter) {
    id
    title
    description
    location { coordinates address }
    startDate
    endDate
    maxParticipants
    participants { id name }
  }
}

# Variables
{
  "filter": {
    "startDateFrom": "2024-12-01T00:00:00Z",
    "startDateTo": "2024-12-31T23:59:59Z"
  }
}
```

**Get Nearby Events:**

```graphql
query NearbyEvents($latitude: Float!, $longitude: Float!, $radius: Float) {
  nearbyEvents(latitude: $latitude, longitude: $longitude, radius: $radius) {
    id
    title
    location { coordinates address }
    distance  # in meters
  }
}

# Variables
{
  "latitude": 52.5200,
  "longitude": 13.4050,
  "radius": 5000  # 5km
}
```

---

### Article Queries

**Get Articles:**

```graphql
query GetArticles($category: String) {
  articles(category: $category) {
    id
    title
    content
    category
    imageUrl
    createdAt
  }
}
```

**Get Article:**

```graphql
query GetArticle($id: ID!) {
  article(id: $id) {
    id
    title
    content
    category
    imageUrl
    tags
    createdAt
  }
}
```

---

## 7.5 Mutations

### User Mutations

**Update Profile:**

```graphql
mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    id
    name
    avatar
    bio
  }
}

# Variables
{
  "input": {
    "name": "Jane Doe",
    "bio": "Passionate about recycling!"
  }
}
```

---

### Post Mutations

**Create Post:**

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    createdAt
  }
}

# Variables
{
  "input": {
    "title": "Old Laptop for Donation",
    "description": "Working condition, slightly used",
    "category": "ELECTRONICS",
    "condition": "GOOD",
    "images": ["https://..."],
    "tags": ["laptop", "donation", "free"],
    "location": {
      "type": "Point",
      "coordinates": [13.4050, 52.5200],
      "address": "Alexanderplatz, Berlin"
    }
  }
}
```

**Like Post:**

```graphql
mutation LikePost($postId: ID!) {
  likePost(postId: $postId) {
    id
    likesCount
  }
}
```

**Comment on Post:**

```graphql
mutation CommentOnPost($postId: ID!, $content: String!) {
  commentOnPost(postId: $postId, content: $content) {
    id
    content
    author { id name }
    createdAt
  }
}
```

**Delete Post:**

```graphql
mutation DeletePost($id: ID!) {
  deletePost(id: $id)
}
```

---

### Event Mutations

**Register for Event:**

```graphql
mutation RegisterForEvent($eventId: ID!) {
  registerForEvent(eventId: $eventId) {
    id
    participants { id }
  }
}
```

**Check-in to Event (QR Code):**

```graphql
mutation CheckInEvent($qrCode: String!) {
  checkInEvent(qrCode: $qrCode) {
    success
    points  # Points awarded
  }
}
```

---

### Gamification

**Award Points (Admin only):**

```graphql
mutation AwardPoints($userId: ID!, $points: Int!, $reason: String!) {
  awardPoints(userId: $userId, points: $points, reason: $reason) {
    id
    points
    badges { id name }
  }
}
```

---

## 7.6 Error Handling

### Standard Error Format

```json
{
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "USER_NOT_FOUND",
        "userId": "123"
      }
    }
  ]
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHENTICATED` | Missing or invalid token | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `BAD_USER_INPUT` | Validation error | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `INTERNAL_SERVER_ERROR` | Server error | 500 |

---

## 7.7 Rate Limiting

**Global Rate Limit:** 100 requests/minute per IP
**Mutation Rate Limit:** 20 mutations/minute per user

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640000000
```

---

## 7.8 Pagination

**Standard Pagination Format:**

```graphql
type PaginatedPosts {
  items: [Post!]!
  total: Int!
  page: Int!
  limit: Int!
  hasMore: Boolean!
}
```

**Example:**

```graphql
query {
  posts(page: 2, limit: 20) {
    items { id title }
    total
    hasMore
  }
}
```

---

## 7.9 Input Validation Rules

### CreatePostInput

| Field | Type | Validation |
|-------|------|------------|
| `title` | String! | 3-100 characters |
| `description` | String | Max 1000 characters |
| `category` | Category! | Must be valid enum |
| `condition` | Condition! | Must be valid enum |
| `images` | [String!]! | Min 1, max 4 URLs |
| `tags` | [String!] | Max 10 tags |
| `location` | LocationInput | Valid GeoJSON Point |

### RegisterInput

| Field | Type | Validation |
|-------|------|------------|
| `email` | String! | Valid email format |
| `password` | String! | Min 8 chars, 1 uppercase, 1 number |
| `name` | String! | 2-50 characters |

---

## 7.10 Example Client Code

### Apollo Client (React Native)

```typescript
import { gql, useMutation, useQuery } from '@apollo/client';

// Query
const GET_POSTS = gql`
  query GetPosts {
    posts {
      items { id title author { name } }
    }
  }
`;

const { data, loading } = useQuery(GET_POSTS);

// Mutation
const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) { id title }
  }
`;

const [createPost] = useMutation(CREATE_POST);

await createPost({
  variables: {
    input: { title: 'Test', category: 'ELECTRONICS', ... }
  }
});
```

---

**Previous:** [← Installation](06-installation.md) | **Next:** [Known Issues →](08-known-issues.md)
