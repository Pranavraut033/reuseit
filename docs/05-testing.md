# 5. Testing Strategy

## 5.1 Testing Approach

ReUseIt employs a **three-layer testing strategy** to ensure quality and reliability.

### Testing Pyramid

```
        ╱╲
       ╱E2E╲         10% - Critical user flows
      ╱──────╲
     ╱Integration╲    30% - API endpoints
    ╱────────────╲
   ╱  Unit Tests  ╲   60% - Business logic
  ╱────────────────╲
```

**Target Coverage:** 80%+ overall | **Actual:** 83%

---

## 5.2 Unit Testing

**Framework:** Jest
**Coverage:** 87% (services), 79% (resolvers)

### Backend Unit Tests

#### Example: Authentication Service

```typescript
describe('AuthService', () => {
  it('should successfully register a new user', async () => {
    const input = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    };

    const result = await service.register(input);

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
  });

  it('should reject duplicate email registration', async () => {
    await expect(
      service.register({ email: 'existing@test.com', ... })
    ).rejects.toThrow('Email already exists');
  });

  it('should reject weak passwords', async () => {
    await expect(
      service.register({ password: '123', ... })
    ).rejects.toThrow('Password must be at least 8 characters');
  });
});
```

#### Example: Points Service

```typescript
describe('PointsService', () => {
  it('should award 10 points for post creation', async () => {
    const userId = 'user-123';
    await service.awardPoints(userId, 'POST_CREATED');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user.points).toBe(10);
  });

  it('should unlock badge at 100 points threshold', async () => {
    const userId = 'user-123';
    await prisma.user.update({
      where: { id: userId },
      data: { points: 95 },
    });

    await service.awardPoints(userId, 'POST_CREATED'); // +10 = 105

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user.badges).toContainEqual('RECYCLING_ENTHUSIAST');
  });
});
```

---

## 5.3 Integration Testing

**Framework:** Jest + Supertest
**Coverage:** 81%

### API Endpoint Tests

#### Example: Post Creation

```typescript
describe('POST /graphql (createPost)', () => {
  it('should create a post with valid authentication', async () => {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          id
          title
          author { id }
        }
      }
    `;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        query: mutation,
        variables: {
          input: {
            title: 'Free Laptop',
            category: 'ELECTRONICS',
            condition: 'GOOD',
          },
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.createPost.title).toBe('Free Laptop');
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation, variables: { ... } });

    expect(response.status).toBe(401);
  });
});
```

---

## 5.4 End-to-End Testing

**Framework:** Detox (React Native)
**Coverage:** 5 critical user flows

### Test Scenarios

#### E2E-01: User Registration Flow

```typescript
describe('User Registration', () => {
  it('should register a new user successfully', async () => {
    await element(by.id('register-button')).tap();
    await element(by.id('email-input')).typeText('newuser@test.com');
    await element(by.id('password-input')).typeText('SecurePass123!');
    await element(by.id('name-input')).typeText('New User');
    await element(by.id('submit-button')).tap();

    await expect(element(by.text('Welcome!'))).toBeVisible();
  });
});
```

#### E2E-02: Post Creation Flow

```typescript
it('should create a post with image', async () => {
  await element(by.id('create-post-button')).tap();
  await element(by.id('title-input')).typeText('Donate Old Chair');
  await element(by.id('category-picker')).tap();
  await element(by.text('Furniture')).tap();
  await element(by.id('add-image-button')).tap();
  await element(by.text('Choose from Library')).tap();
  // Mock image picker selection
  await element(by.id('publish-button')).tap();

  await expect(element(by.text('Post published!'))).toBeVisible();
});
```

---

## 5.5 Concrete Test Cases (Execution Log)

### TC-01: Authentication - Invalid Email Format

| Field | Value |
|-------|-------|
| **Input** | Email: `user..test.com` / Pass: `123456` |
| **Expected** | Inline error: "Invalid email format" (no API call) |
| **Result** | ✅ Pass |
| **Execution Time** | 0.02s |

---

### TC-02: ML - Scan Recyclable Item

| Field | Value |
|-------|-------|
| **Input** | Image: `plastic_bottle.jpg` |
| **Expected** | Confidence >85%, Label: "Plastic (PET)", Prompt: "Recycle at yellow bin" |
| **Actual** | Confidence: 92%, Label: "Plastic (PET)" |
| **Result** | ✅ Pass |
| **Execution Time** | 2.1s |

---

### TC-03: ML - Scan Unknown Item

| Field | Value |
|-------|-------|
| **Input** | Image: `blurry_floor.jpg` |
| **Expected** | Confidence <40%, Prompt: "Retake photo or search manually" |
| **Actual** | Confidence: 18%, Prompt displayed |
| **Result** | ✅ Pass |
| **Execution Time** | 1.8s |

---

### TC-04: Events - Duplicate Registration

| Field | Value |
|-------|-------|
| **Input** | User: `ID_99`, Event: `Event_A` (already joined) |
| **Expected** | Toast: "You are already registered for this event" |
| **Actual** | Toast displayed, no duplicate entry in DB |
| **Result** | ✅ Pass |
| **Execution Time** | 0.15s |

---

### TC-05: Content - Offline Access

| Field | Value |
|-------|-------|
| **Input** | Network: Disabled, Action: Open "Recycling Guide" |
| **Expected** | Content loads from Apollo Cache, "Offline Mode" banner |
| **Actual** | Article displayed from cache, banner shown |
| **Result** | ✅ Pass |
| **Execution Time** | 0.05s |

---

### TC-06: Gamification - Point Award

| Field | Value |
|-------|-------|
| **Input** | User posts item |
| **Expected** | User points increase by +10 |
| **Actual** | Points: 45 → 55 |
| **Result** | ✅ Pass |
| **Execution Time** | 0.12s |

---

### TC-07: Location - Find Nearby Centers

| Field | Value |
|-------|-------|
| **Input** | GPS: 52.5200° N, 13.4050° E (Berlin) |
| **Expected** | Display 5+ recycling centers within 2km |
| **Actual** | 7 centers displayed on map |
| **Result** | ✅ Pass |
| **Execution Time** | 0.68s |

---

### TC-08: Performance - Concurrent Load

| Field | Value |
|-------|-------|
| **Input** | 500 concurrent API requests (Artillery) |
| **Expected** | Avg response time <500ms, 0% error rate |
| **Actual** | Avg: 240ms, Errors: 0% |
| **Result** | ✅ Pass |
| **Duration** | 60s load test |

---

## 5.6 Non-Functional Requirement Validation

### NFR1: Application Launch Time

**Test Method:** Chrome DevTools Performance profiling + manual stopwatch

**Results:**
- Trial 1: 1.75s
- Trial 2: 1.82s
- Trial 3: 1.84s
- **Average: 1.80s** ✅ (Target: <2s)

---

### NFR2: ML Inference Speed

**Test Method:** 100 sample images, average processing time

**Results:**
- Mean: 2.1s
- Median: 2.0s
- 95th percentile: 2.8s
- **Status:** ✅ Pass (Target: <3s)

---

### NFR3: Accessibility

**Test Method:** Manual audit + TalkBack screen reader

**Compliance:**
- ✅ Contrast ratio >4.5:1 for all text
- ✅ Dynamic font scaling works
- ✅ Screen reader labels present on interactive elements
- ✅ Keyboard navigation functional

---

### NFR4: Security

**Test Method:** OWASP ZAP automated scan + manual penetration testing

**Findings:**
- ✅ No SQL injection vulnerabilities
- ✅ XSS prevented by React Native's auto-escaping
- ✅ HTTPS enforced
- ✅ Passwords hashed with bcrypt

---

### NFR5: Offline Functionality

**Test Method:** Airplane mode activation during app use

**Capabilities Verified:**
- ✅ Cached articles accessible
- ✅ Mutations queued and retry on reconnection
- ✅ "Offline Mode" banner displayed
- ✅ No app crashes

---

### NFR6: Scalability

**Test Method:** Artillery load testing

**Results:**

| Concurrent Users | Avg Response Time | Error Rate |
|------------------|-------------------|------------|
| 100 | 95ms | 0% |
| 250 | 180ms | 0% |
| 500 | 240ms | 0% |
| 750 | 420ms | 0.1% |
| 1000 | 580ms | 0.3% |

**Status:** ✅ Pass at 500 users (Target: 500 concurrent)

---

## 5.7 Test Automation

### CI/CD Integration (GitHub Actions)

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: pnpm install
      - name: Run unit tests
        run: pnpm --filter backend test
      - name: Run E2E tests
        run: pnpm --filter backend test:e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

**Execution Frequency:** On every commit to `main` or `develop`

---

## 5.8 Test Coverage Report

```
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   83.12 |    76.84 |   81.45 |   83.89 |
 auth/                 |   95.23 |    88.12 |   93.75 |   95.67 |
  auth.service.ts      |   96.45 |    90.00 |   95.00 |   96.88 |
  auth.resolver.ts     |   93.12 |    85.00 |   91.67 |   93.45 |
 post/                 |   88.34 |    78.45 |   86.21 |   89.12 |
  post.service.ts      |   91.23 |    82.34 |   89.47 |   92.01 |
  post.resolver.ts     |   84.56 |    73.21 |   82.14 |   85.34 |
 event/                |   79.12 |    71.23 |   77.89 |   80.45 |
  event.service.ts     |   82.34 |    75.12 |   81.23 |   83.67 |
 points/               |   91.45 |    85.67 |   90.12 |   92.34 |
  points.service.ts    |   93.12 |    87.89 |   92.45 |   94.01 |
```

**Overall:** 83.12% ✅ (Target: >80%)

---

**Previous:** [← Implementation](04-implementation.md) | **Next:** [Installation →](06-installation.md)
