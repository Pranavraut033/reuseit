# Safe Upsert Helper Usage

The `PrismaService.safeUpsert()` method provides a fully type-safe, transaction-aware upsert operation that automatically falls back to manual upsert logic when the database doesn't support transactions (e.g., MongoDB free tier).

## Features

- ✅ Automatic transaction support detection on startup
- ✅ Intelligent fallback to manual upsert when needed
- ✅ **Full TypeScript type safety** with Prisma-generated types
- ✅ Type-checked `where`, `create`, and `update` parameters
- ✅ Works with any Prisma model
- ✅ Runtime switching if transaction errors occur
- ✅ Autocomplete support in your IDE

## Usage Examples

### Basic Usage (User Model)

```typescript
const user = await this.prismaService.safeUpsert('User', this.prismaService.user, {
  where: { email: 'user@example.com' }, // TypeScript knows this must be UserWhereUniqueInput
  update: {
    name: 'Updated Name',
    lastLogin: new Date(),
  }, // TypeScript validates against UserUpdateInput
  create: {
    email: 'user@example.com',
    name: 'New User',
  }, // TypeScript validates against UserCreateInput
});
// user is properly typed as User with full autocomplete
console.log(user.email, user.id, user.name);
```

### With Post Model

```typescript
const post = await this.prismaService.safeUpsert('Post', this.prismaService.post, {
  where: { id: postId },
  update: {
    title: 'Updated Title',
    content: 'Updated Content',
  },
  create: {
    title: 'New Post',
    content: 'New Content',
    author: {
      connect: { id: userId },
    },
  },
});
// post is typed as Post
```

### With Event Model

```typescript
const event = await this.prismaService.safeUpsert('Event', this.prismaService.event, {
  where: { id: eventId },
  update: {
    name: 'Updated Event',
    date: new Date(),
  },
  create: {
    name: 'New Event',
    date: new Date(),
    creator: {
      connect: { id: userId },
    },
    location: { lat: 0, lng: 0 },
  },
});
// event is typed as Event
```

### Composite Unique Keys

```typescript
const badgeAssignment = await this.prismaService.safeUpsert(
  'BadgeAssignment',
  this.prismaService.badgeAssignment,
  {
    where: {
      userId_badgeId: {
        userId: 'user-id',
        badgeId: 'badge-id',
      },
    },
    update: {
      assignedAt: new Date(),
    },
    create: {
      user: {
        connect: { id: 'user-id' },
      },
      badge: {
        connect: { id: 'badge-id' },
      },
      assignedAt: new Date(),
    },
  },
);
// badgeAssignment is typed as BadgeAssignment
```

### With Google Sign-In (From auth.service.ts)

```typescript
const user = await this.prismaService.safeUpsert('User', this.prismaService.user, {
  where: { googleId },
  update: {
    name,
    email: normalizedEmail,
    emailVerified,
    phoneNumber,
    avatarUrl,
    lastLogin: new Date(),
  },
  create: {
    googleId,
    name,
    email: normalizedEmail,
    emailVerified,
    phoneNumber,
    avatarUrl,
  },
});
```

## Type Safety Benefits

### Before (No Type Safety):

```typescript
// Old approach - all parameters are 'any'
const user = await this.prisma.user.upsert({
  where: { emial: 'wrong@field.com' }, // ❌ Typo not caught!
  update: { invalidField: 'oops' }, // ❌ Invalid field not caught!
  create: { name: 'Missing required fields' }, // ❌ Missing email not caught!
});
```

### After (Full Type Safety):

```typescript
// New approach - all parameters are type-checked
const user = await this.prismaService.safeUpsert('User', this.prismaService.user, {
  where: { emial: 'wrong@field.com' }, // ✅ TypeScript error: 'emial' doesn't exist
  update: { invalidField: 'oops' }, // ✅ TypeScript error: 'invalidField' doesn't exist
  create: { name: 'Missing required fields' }, // ✅ TypeScript error: 'email' is required
});
```

## Supported Models

The helper automatically provides type safety for all your Prisma models:

- `User` - UserWhereUniqueInput, UserCreateInput, UserUpdateInput
- `Post` - PostWhereUniqueInput, PostCreateInput, PostUpdateInput
- `Event` - EventWhereUniqueInput, EventCreateInput, EventUpdateInput
- `Badge` - BadgeWhereUniqueInput, BadgeCreateInput, BadgeUpdateInput
- `BadgeAssignment` - BadgeAssignmentWhereUniqueInput, etc.
- `Comment` - CommentWhereUniqueInput, etc.
- `PointsHistory` - PointsHistoryWhereUniqueInput, etc.
- `UserArticle` - UserArticleWhereUniqueInput, etc.
- `EvenParticipant` - EvenParticipantWhereUniqueInput, etc.

## How It Works

1. **On Startup**: The service checks if the database supports transactions by running an empty transaction test
2. **If Supported**: Uses native Prisma `upsert()` for optimal performance
3. **If Not Supported**: Automatically uses manual find → update/create pattern
4. **Runtime Fallback**: If a transaction error occurs despite initial support, switches to manual mode
5. **Type Inference**: TypeScript uses the model name to infer all input and output types

## Migration from Standard Upsert

**Before:**

```typescript
const user = await this.prisma.user.upsert({
  where: { googleId },
  update: { ... },
  create: { ... },
});
```

**After:**

```typescript
const user = await this.prismaService.safeUpsert(
  'User',                      // Model name for type inference
  this.prismaService.user,     // Model delegate
  {
    where: { googleId },
    update: { ... },
    create: { ... },
  },
);
```

## Performance Considerations

- **With Transaction Support**: Same performance as native `upsert()`
- **Without Transaction Support**: Requires 1-2 queries (find + update/create)
- Detection happens once at startup, minimal overhead
- Type checking is compile-time only, zero runtime cost

## Error Handling

The helper handles transaction errors automatically. Other Prisma errors (validation, unique constraints, etc.) are thrown normally and should be handled by your application logic.

## Adding New Models

When you add new models to your Prisma schema, update the type mappings in `prisma.service.ts`:

```typescript
// Add to WhereUniqueInput
type WhereUniqueInput<T extends PrismaModelName> =
  T extends 'YourNewModel' ? Prisma.YourNewModelWhereUniqueInput :
  // ... existing types

// Add to CreateInput
type CreateInput<T extends PrismaModelName> =
  T extends 'YourNewModel' ? Prisma.YourNewModelCreateInput :
  // ... existing types

// Add to UpdateInput
type UpdateInput<T extends PrismaModelName> =
  T extends 'YourNewModel' ? Prisma.YourNewModelUpdateInput :
  // ... existing types

// Add to ModelType
type ModelType<T extends PrismaModelName> =
  T extends 'YourNewModel' ? YourNewModel :
  // ... existing types
```

Don't forget to import the model type at the top of the file!
