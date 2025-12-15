# Testing Strategy

This document outlines the comprehensive testing approach for the ReUseIt application, including testing levels, frameworks, examples, and best practices.

---

## Overview

ReUseIt employs a multi-layered testing strategy to ensure quality, reliability, and maintainability. Our target is **80%+ code coverage** across all modules.

### Testing Pyramid

```
        ╱╲
       ╱E2E╲         <- End-to-End Tests (10%)
      ╱──────╲
     ╱Integration╲    <- Integration Tests (30%)
    ╱────────────╲
   ╱  Unit Tests  ╲   <- Unit Tests (60%)
  ╱────────────────╲
```

---

## Testing Levels

### 1. Unit Testing

**Purpose:** Test individual functions, methods, and components in isolation.

**Framework:** Jest  
**Coverage Target:** 80%+  
**Location:** `*.spec.ts` files alongside source code

#### Backend Unit Tests

**Example: Authentication Service**

```typescript
// backend/src/auth/auth.service.spec.ts

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('should successfully register a new user with valid email and password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const result = await service.register(input);

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'Pass123!',
        name: 'Existing User',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: '1',
        email: input.email,
      } as any);

      await expect(service.register(input)).rejects.toThrow('Email already exists');
    });

    it('should reject weak passwords shorter than 8 characters', async () => {
      const input = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      };

      await expect(service.register(input)).rejects.toThrow(
        'Password must be at least 8 characters',
      );
    });

    it('should hash password before storing in database', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const createSpy = jest.spyOn(prisma.user, 'create');
      await service.register(input);

      const calledWith = createSpy.mock.calls[0][0];
      expect(calledWith.data.password).not.toBe('SecurePass123!');
      expect(calledWith.data.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const result = await service.login(input);

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(input.email);
    });

    it('should reject login with invalid email', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow('Invalid credentials');
    });

    it('should reject login with incorrect password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      await expect(service.login(input)).rejects.toThrow('Invalid credentials');
    });
  });
});
```

**Example: Image Recognition Service**

```typescript
// backend/src/ml/image-recognition.service.spec.ts

describe('ImageRecognitionService', () => {
  let service: ImageRecognitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageRecognitionService],
    }).compile();

    service = module.get<ImageRecognitionService>(ImageRecognitionService);
  });

  describe('identifyItem', () => {
    it('should identify a plastic bottle with >80% confidence', async () => {
      const imageData = loadTestImage('plastic-bottle.jpg');
      const result = await service.identifyItem(imageData);

      expect(result.label).toBe('Plastic Bottle');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.materialType).toBe('PLASTIC');
    });

    it('should identify an aluminum can correctly', async () => {
      const imageData = loadTestImage('aluminum-can.jpg');
      const result = await service.identifyItem(imageData);

      expect(result.label).toBe('Aluminum Can');
      expect(result.materialType).toBe('METAL');
    });

    it('should return recycling instructions for identified items', async () => {
      const imageData = loadTestImage('aluminum-can.jpg');
      const result = await service.identifyItem(imageData);

      expect(result.recyclingInstructions).toBeDefined();
      expect(result.recyclingInstructions).toContain('rinse');
      expect(result.recyclingInstructions.length).toBeGreaterThan(10);
    });

    it('should return multiple predictions when confidence is low', async () => {
      const imageData = loadTestImage('unclear-item.jpg');
      const result = await service.identifyItem(imageData);

      expect(result.predictions).toHaveLength(3);
      expect(result.predictions[0].confidence).toBeLessThan(0.7);
    });

    it('should handle invalid image data gracefully', async () => {
      const invalidData = Buffer.from('not an image');

      await expect(service.identifyItem(invalidData)).rejects.toThrow('Invalid image format');
    });
  });
});
```

#### Frontend Unit Tests

**Example: React Component**

```typescript
// mobile/components/Auth/LoginForm.spec.tsx

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  it('should render email and password inputs', () => {
    const { getByTestId } = render(<LoginForm onLogin={mockOnLogin} />);

    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('should call onLogin with email and password when form is submitted', async () => {
    const { getByTestId } = render(<LoginForm onLogin={mockOnLogin} />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'SecurePass123!');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
    });
  });

  it('should show validation error for invalid email', async () => {
    const { getByTestId, getByText } = render(<LoginForm onLogin={mockOnLogin} />);

    fireEvent.changeText(getByTestId('email-input'), 'invalid-email');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByText('Please enter a valid email')).toBeTruthy();
    });
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should disable login button while submitting', async () => {
    mockOnLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByTestId } = render(<LoginForm onLogin={mockOnLogin} />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'SecurePass123!');
    fireEvent.press(getByTestId('login-button'));

    expect(getByTestId('login-button')).toBeDisabled();
  });
});
```

---

### 2. Integration Testing

**Purpose:** Test interactions between multiple components, modules, or services.

**Framework:** Jest + Supertest (backend), React Native Testing Library (mobile)  
**Coverage Target:** 30% of total tests

#### Backend Integration Tests

**Example: Post Creation Flow**

```typescript
// backend/src/post/post.integration.spec.ts

describe('Post Creation Flow (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Create test user and get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            register(input: {
              email: "testuser@example.com"
              password: "SecurePass123!"
              name: "Test User"
            }) {
              token
              user { id }
            }
          }
        `,
      });

    authToken = authResponse.body.data.register.token;
    userId = authResponse.body.data.register.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.post.deleteMany({});
    await app.close();
  });

  it('should create a post, save to database, and return with user details', async () => {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          id
          title
          description
          type
          author {
            id
            name
            email
          }
          createdAt
        }
      }
    `;

    const variables = {
      input: {
        title: 'Free Cardboard Boxes',
        description: '10 moving boxes available for pickup',
        type: 'DONATION',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      },
    };

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation, variables });

    expect(response.status).toBe(200);
    expect(response.body.data.createPost.title).toBe('Free Cardboard Boxes');
    expect(response.body.data.createPost.author.id).toBe(userId);

    // Verify database persistence
    const dbPost = await prisma.post.findUnique({
      where: { id: response.body.data.createPost.id },
    });
    expect(dbPost).toBeDefined();
    expect(dbPost.title).toBe('Free Cardboard Boxes');
  });

  it('should award points to user after creating post', async () => {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          id
        }
      }
    `;

    const variables = {
      input: {
        title: 'Free Books',
        description: 'Educational books',
        type: 'DONATION',
      },
    };

    await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation, variables });

    // Check user points increased
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId },
    });

    expect(userPoints.total).toBeGreaterThan(0);
  });
});
```

**Example: Event Registration & Check-in Flow**

```typescript
describe('Event Registration & Check-in Flow', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let eventId: string;

  beforeAll(async () => {
    // Setup app and create test user (similar to above)
  });

  it('should register user for event, update participant count, and allow check-in', async () => {
    // 1. Create event
    const createEventMutation = `
      mutation CreateEvent($input: CreateEventInput!) {
        createEvent(input: $input) {
          id
          title
          maxParticipants
          currentParticipants
        }
      }
    `;

    const eventResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: createEventMutation,
        variables: {
          input: {
            title: 'Community Cleanup',
            description: 'Beach cleanup event',
            startDate: new Date(Date.now() + 86400000).toISOString(),
            endDate: new Date(Date.now() + 90000000).toISOString(),
            maxParticipants: 50,
            location: {
              latitude: 40.7128,
              longitude: -74.006,
            },
          },
        },
      });

    eventId = eventResponse.body.data.createEvent.id;
    expect(eventResponse.body.data.createEvent.currentParticipants).toBe(0);

    // 2. Register for event
    const registerMutation = `
      mutation RegisterForEvent($eventId: ID!) {
        registerForEvent(eventId: $eventId) {
          success
          message
        }
      }
    `;

    const registerResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: registerMutation,
        variables: { eventId },
      });

    expect(registerResponse.body.data.registerForEvent.success).toBe(true);

    // 3. Verify participant count updated
    const getEventQuery = `
      query GetEvent($id: ID!) {
        event(id: $id) {
          currentParticipants
          participants {
            id
          }
        }
      }
    `;

    const eventCheckResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: getEventQuery,
        variables: { id: eventId },
      });

    expect(eventCheckResponse.body.data.event.currentParticipants).toBe(1);
    expect(eventCheckResponse.body.data.event.participants).toHaveLength(1);

    // 4. Check-in to event
    const checkinMutation = `
      mutation CheckInToEvent($eventId: ID!) {
        checkInToEvent(eventId: $eventId) {
          success
          pointsEarned
        }
      }
    `;

    const checkinResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: checkinMutation,
        variables: { eventId },
      });

    expect(checkinResponse.body.data.checkInToEvent.success).toBe(true);
    expect(checkinResponse.body.data.checkInToEvent.pointsEarned).toBeGreaterThan(0);
  });
});
```

---

### 3. End-to-End (E2E) Testing

**Purpose:** Test complete user journeys from UI to database.

**Framework:** Detox (mobile), Supertest (API)  
**Coverage Target:** 10% of total tests (critical paths only)

**Example: Complete User Journey**

```typescript
// mobile/e2e/userJourney.e2e.ts

describe('Complete User Journey: New User to First Event', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should allow user to register, identify item, create post, and join event', async () => {
    // 1. User Registration
    await element(by.id('get-started-button')).tap();
    await element(by.id('register-tab')).tap();

    await element(by.id('name-input')).typeText('Test User');
    await element(by.id('email-input')).typeText('newuser@example.com');
    await element(by.id('password-input')).typeText('SecurePass123!');
    await element(by.id('confirm-password-input')).typeText('SecurePass123!');
    await element(by.id('submit-register')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // 2. Item Identification
    await element(by.id('identify-tab')).tap();
    await element(by.id('camera-permission-allow')).tap();

    // Simulate taking photo (in test environment)
    await element(by.id('take-photo-button')).tap();

    await waitFor(element(by.id('identification-result')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('item-label'))).toHaveText('Plastic Bottle');
    await expect(element(by.id('confidence-score'))).toBeVisible();
    await expect(element(by.id('recycling-instructions'))).toBeVisible();

    // 3. Create Community Post
    await element(by.id('community-tab')).tap();
    await element(by.id('create-post-fab')).tap();

    await element(by.id('post-title-input')).typeText('Plastic bottles available');
    await element(by.id('post-description-input')).typeText('5 clean plastic bottles, ready for recycling');
    await element(by.id('post-type-donation')).tap();
    await element(by.id('submit-post')).tap();

    await waitFor(element(by.text('Post created successfully')))
      .toBeVisible()
      .withTimeout(3000);

    // 4. Register for Event
    await element(by.id('events-tab')).tap();
    await element(by.id('event-list')).swipe('up');
    await element(by.id('event-item-0')).tap();

    await expect(element(by.id('event-details'))).toBeVisible();
    await element(by.id('register-event-button')).tap();

    await waitFor(element(by.text('Registration successful')))
      .toBeVisible()
      .withTimeout(3000);

    // 5. Check Points Earned
    await element(by.id('profile-tab')).tap();
    await expect(element(by.id('points-display'))).toBeVisible();

    // User should have points from registration, post creation
    const pointsText = await element(by.id('points-display')).getText Attribute('text');
    const points = parseInt(pointsText);
    expect(points).toBeGreaterThan(0);
  });
});
```

---

### 4. Performance Testing

**Purpose:** Ensure the application meets performance requirements.

**Tools:** Lighthouse, React Native Performance Monitor, Custom benchmarks

**Example: Performance Benchmarks**

```typescript
describe('Performance Benchmarks', () => {
  it('should load home screen within 2 seconds', async () => {
    const startTime = Date.now();

    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-screen'))).toBeVisible();

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
    console.log(`Home screen loaded in ${loadTime}ms`);
  });

  it('should complete image recognition within 3 seconds', async () => {
    const imageData = await loadTestImage('test-item.jpg');

    const startTime = Date.now();
    const result = await mlService.identifyItem(imageData);
    const inferenceTime = Date.now() - startTime;

    expect(inferenceTime).toBeLessThan(3000);
    expect(result.confidence).toBeGreaterThan(0.6);

    console.log(`Image recognition completed in ${inferenceTime}ms`);
  });

  it('should return API responses within 500ms', async () => {
    const startTime = Date.now();

    const response = await request(app.getHttpServer()).post('/graphql').send({
      query: '{ posts(limit: 10) { id title } }',
    });

    const responseTime = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(500);

    console.log(`API response time: ${responseTime}ms`);
  });
});
```

---

### 5. Security Testing

**Purpose:** Validate authentication, authorization, and input security.

**Example: Security Tests**

```typescript
describe('Security: Authentication & Authorization', () => {
  it('should reject requests without valid JWT token', async () => {
    const response = await request(app.getHttpServer()).post('/graphql').send({
      query: '{ me { id email } }',
    });

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Unauthorized');
  });

  it('should reject requests with expired JWT token', async () => {
    const expiredToken = jwt.sign({ userId: '123' }, JWT_SECRET, {
      expiresIn: '-1h',
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({
        query: '{ me { id email } }',
      });

    expect(response.body.errors[0].message).toContain('Token expired');
  });

  it('should prevent users from accessing other users private data', async () => {
    const otherUserQuery = `
      query {
        user(id: "${otherUser.id}") {
          email
          privateNotes
        }
      }
    `;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${currentUserToken}`)
      .send({ query: otherUserQuery });

    expect(response.body.errors[0].message).toContain('Forbidden');
  });

  it('should sanitize user input to prevent XSS attacks', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';

    const mutation = `
      mutation {
        createPost(input: {
          title: "${maliciousInput}"
          description: "Test"
          type: DONATION
        }) {
          id
          title
        }
      }
    `;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation });

    const title = response.body.data.createPost.title;
    expect(title).not.toContain('<script>');
    expect(title).not.toContain('</script>');
  });

  it('should rate limit API requests', async () => {
    const requests = [];

    // Send 100 requests rapidly
    for (let i = 0; i < 100; i++) {
      requests.push(request(app.getHttpServer()).post('/graphql').send({ query: '{ health }' }));
    }

    const responses = await Promise.all(requests);
    const tooManyRequests = responses.filter((r) => r.status === 429);

    expect(tooManyRequests.length).toBeGreaterThan(0);
  });
});
```

---

## Running Tests

### Run All Tests

```bash
# From root directory
pnpm test
```

### Backend Tests

```bash
cd backend

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run E2E tests
pnpm test:e2e
```

### Mobile Tests

```bash
cd mobile

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test --coverage

# Run E2E tests
pnpm test:e2e
```

---

## Coverage Reports

Generate and view coverage reports:

```bash
# Backend
cd backend
pnpm test:cov
open coverage/lcov-report/index.html

# Mobile
cd mobile
pnpm test --coverage
open coverage/lcov-report/index.html
```

---

## Continuous Integration

All tests run automatically on every push and pull request via GitHub Actions:

- ✅ Linting and type checking
- ✅ Unit tests with coverage reports
- ✅ Integration tests
- ✅ E2E tests (on supported platforms)
- ✅ Performance benchmarks
- ✅ Security vulnerability scanning

---

## Best Practices

1. **Write tests first** (TDD when possible)
2. **Keep tests isolated** - no dependencies between tests
3. **Use descriptive test names** - clearly state what is being tested
4. **Test edge cases** - not just happy paths
5. **Mock external dependencies** - don't rely on external services
6. **Maintain test data** - use factories or fixtures
7. **Keep tests fast** - unit tests should run in milliseconds
8. **Update tests with code** - don't let tests become outdated

---

_Last Updated: November 2025_
