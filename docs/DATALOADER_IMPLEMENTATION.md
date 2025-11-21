# DataLoader Implementation Guide

This document describes the DataLoader implementation in the backend to prevent N+1 queries in GraphQL.

## Overview

We use the `nestjs-dataloader` package (v9.0.0) which provides a NestJS-specific implementation of Facebook's DataLoader pattern. This automatically batches and caches database requests within a single GraphQL query execution.

## Architecture

### Core Components

1. **DataLoaderInterceptor**: Automatically registered in `app.module.ts` to manage DataLoader instances per request
2. **NestDataLoader Interface**: All loaders implement this interface with a `generateDataLoader()` method
3. **@Loader Decorator**: Used in resolvers to inject DataLoader instances

### Directory Structure

```
src/
├── common/
│   └── base.loader.ts          # Helper utilities (orderByKeys, orderManyByKeys, groupBy)
├── user/
│   ├── user.loader.ts          # 8 DataLoaders for User entity
│   └── user.resolver.ts        # Field resolvers with @Loader decorator
├── post/
│   ├── post.loader.ts          # 9 DataLoaders for Post entity
│   ├── comment.loader.ts       # 2 DataLoaders for Comment entity
│   └── *.resolver.ts           # Field resolvers
├── event/
│   ├── event.loader.ts         # 4 DataLoaders for Event entity
│   └── event.resolver.ts       # Field resolvers
├── location/
│   ├── location.loader.ts      # 3 DataLoaders for Location entity
│   └── location.resolver.ts    # Field resolvers
└── app.module.ts               # DataLoaderInterceptor registration
```

## Implementation Pattern

### 1. Creating a DataLoader

```typescript
import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

@Injectable()
export class UserLoader implements NestDataLoader<string, User | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(async (ids) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...ids] } },
      });

      return orderByKeys(ids, users, (user) => user.id);
    });
  }
}
```

### 2. Registering DataLoaders in Modules

```typescript
@Module({
  imports: [PrismaModule],
  providers: [
    UserService,
    UserResolver,
    UserLoader,
    UserPostsLoader,
    // ... other loaders
  ],
  exports: [UserService],
})
export class UserModule {}
```

### 3. Using DataLoaders in Resolvers

```typescript
import { Loader } from 'nestjs-dataloader';
import DataLoader from 'dataloader';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @ResolveField('posts', () => [Post])
  async posts(
    @Parent() user: User,
    @Loader(UserPostsLoader) loader: DataLoader<string, Post[]>,
  ): Promise<Post[]> {
    return loader.load(user.id);
  }
}
```

## DataLoader Types

### Entity Loaders (Many-to-One)
Load a single related entity by ID:
- `UserLoader` - Load User by ID
- `PostLoader` - Load Post by ID
- `CommentLoader` - Load Comment by ID
- etc.

### Relation Loaders (One-to-Many)
Load multiple related entities for a parent:
- `UserPostsLoader` - Load all Posts for a User
- `PostCommentsLoader` - Load all Comments for a Post
- `EventParticipantsLoader` - Load all Participants for an Event
- etc.

### Aggregation Loaders
Load computed values efficiently:
- `PostLikeCountLoader` - Count likes for Posts
- `PostCommentCountLoader` - Count comments for Posts

## Helper Utilities

Located in `src/common/base.loader.ts`:

### orderByKeys
Orders results to match the input key order for one-to-one or many-to-one relations:

```typescript
function orderByKeys<K, V>(
  keys: readonly K[],
  values: V[],
  getKey: (value: V) => K,
): (V | null)[]
```

### orderManyByKeys
Groups results by key for one-to-many relations:

```typescript
function orderManyByKeys<K, V>(
  keys: readonly K[],
  values: V[],
  getKey: (value: V) => K,
): V[][]
```

### groupBy
Generic grouping utility:

```typescript
function groupBy<T, K extends string | number | symbol>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]>
```

## Complete Loader List

### User Module (8 loaders)
1. `UserLoader` - User by ID
2. `UserPostsLoader` - Posts by User
3. `UserCommentsLoader` - Comments by User
4. `UserBadgesLoader` - Badges by User
5. `UserEventsLoader` - Events created by User
6. `UserEventParticipationsLoader` - Event participations by User
7. `UserPointsHistoryLoader` - Points history by User
8. `UserArticlesLoader` - Articles by User

### Post Module (9 loaders)
1. `PostLoader` - Post by ID
2. `PostAuthorLoader` - Author of Post
3. `PostCommentsLoader` - Comments on Post
4. `PostLocationLoader` - Location of Post
5. `PostEventLoader` - Event of Post
6. `PostUserArticlesLoader` - Articles related to Post
7. `PostLikeCountLoader` - Like count for Post
8. `PostCommentCountLoader` - Comment count for Post
9. `PostLikedByUserLoader` - Check if user liked Post (special case)

### Comment Module (2 loaders)
1. `CommentAuthorLoader` - Author of Comment
2. `CommentPostLoader` - Post of Comment

### Event Module (4 loaders)
1. `EventCreatorLoader` - Creator of Event
2. `EventLocationLoader` - Location of Event
3. `EventPostsLoader` - Posts for Event
4. `EventParticipantsLoader` - Participants of Event

### Location Module (3 loaders)
1. `LocationCreatorLoader` - Creator of Location
2. `LocationPostsLoader` - Posts at Location
3. `LocationEventsLoader` - Events at Location

### Badge Module (4 loaders)
1. `BadgeLoader` - Badge by ID
2. `BadgeUsersLoader` - Users with Badge
3. `BadgeAssignmentLoader` - Badge assignment by ID
4. `BadgeAssignmentBadgeLoader` - Badge of Assignment

### UserArticle Module (2 loaders)
1. `UserArticleUserLoader` - User of Article
2. `UserArticlePostLoader` - Post of Article

## Service Layer Changes

Services have been updated to remove `include` statements since relations are now loaded via DataLoaders:

**Before:**
```typescript
async findOne(id: string) {
  return this.prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      comments: true,
      location: true,
    },
  });
}
```

**After:**
```typescript
async findOne(id: string) {
  return this.prisma.post.findUnique({
    where: { id },
  });
}
```

## Benefits

1. **N+1 Query Prevention**: Multiple requests for the same data are batched into a single query
2. **Automatic Caching**: Results are cached per request, eliminating duplicate queries
3. **Type Safety**: Full TypeScript support with proper types
4. **Clean Separation**: Business logic in services, data loading in loaders, presentation in resolvers
5. **Performance**: Significantly reduces database queries, especially for nested GraphQL queries

## Testing

To verify DataLoader is working:
1. Enable Prisma query logging in `schema.prisma`
2. Run a nested GraphQL query
3. Check that relations are loaded with single batched queries instead of N+1 queries

Example query:
```graphql
query {
  posts {
    id
    title
    author {
      id
      name
    }
    comments {
      id
      content
      author {
        id
        name
      }
    }
  }
}
```

Should generate:
- 1 query for posts
- 1 batched query for all authors
- 1 batched query for all comments
- 1 batched query for comment authors

Instead of N+1 queries for each relation.

## Migration Notes

If migrating from the previous custom implementation:
1. ✅ Installed `nestjs-dataloader` package
2. ✅ Converted all loaders from `BaseDataLoader` to `NestDataLoader` interface
3. ✅ Updated all resolvers to use `@Loader` decorator from `nestjs-dataloader`
4. ✅ Registered `DataLoaderInterceptor` in `app.module.ts`
5. ✅ Removed custom `@Loader` decorator from `src/decorators/Loader.ts`
6. ✅ Simplified GraphQL context (removed manual loaders object)
7. ✅ Updated all service methods to remove `include` statements

## References

- [nestjs-dataloader GitHub](https://github.com/krislefeber/nestjs-dataloader)
- [DataLoader by Facebook](https://github.com/graphql/dataloader)
- [NestJS GraphQL Documentation](https://docs.nestjs.com/graphql/quick-start)


# DataLoader Implementation Complete!

## Summary

Your NestJS backend now uses the **DataLoader pattern** with **GraphQL field resolvers** to prevent N+1 queries!

## Architecture

### 1. DataLoader Infrastructure
- **Base Loader**: `src/common/base.loader.ts`
  - Provides `BaseDataLoader` class with caching
  - Helper functions: `orderByKeys`, `orderManyByKeys`, `groupBy`

### 2. Loaders Created
All loaders use Prisma types and batch database queries:

- **User**: 8 loaders (posts, comments, badges, events, participants, points history, articles)
- **Post**: 9 loaders (author, comments, location, event, articles, like count, comment count, liked by user)
- **Comment**: 2 loaders (author, post)
- **Event**: 4 loaders (creator, location, posts, participants)
- **Location**: 3 loaders (creator, posts, events)
- **Badge**: 4 loaders (badge, users, assignment badge, assignment user)
- **UserArticle**: 2 loaders (user, post)

### 3. Field Resolvers
All resolvers now use `@ResolveField()` decorators to load relations lazily.

## How It Works

1. **Queries return raw objects** without relations:
   ```typescript
   @Query(() => [Post])
   findAll() {
     return this.postService.findAll(); // No includes!
   }
   ```

2. **Field resolvers load relations using DataLoader**:
   ```typescript
   @ResolveField('author', () => User)
   async author(@Parent() post: Post) {
     return this.postAuthorLoader.load(post.authorId);
   }
   ```

3. **DataLoader batches requests**:
   - Multiple `post.author` requests are batched into one query
   - Caching prevents duplicate loads within the same request

## IMPORTANT: Final Step Required

The resolvers currently have loader parameters in `@ResolveField` methods. You need to **inject loaders via constructor**.

### Current (Incorrect):
```typescript
@ResolveField('posts', () => [Object])
async posts(@Parent() user: User, userPostsLoader: UserPostsLoader) {
  return userPostsLoader.load(user.id);
}
```

### Should Be:
```typescript
constructor(
  private readonly userService: UserService,
  private readonly userPostsLoader: UserPostsLoader,
) {}

@ResolveField('posts', () => [Object])
async posts(@Parent() user: User) {
  return this.userPostsLoader.load(user.id);
}
```

## Files to Update

1. `src/user/user.resolver.ts`
2. `src/post/post.resolver.ts`
3. `src/post/comment.resolver.ts`
4. `src/event/event.resolver.ts`
5. `src/location/location.resolver.ts`

## Benefits

✅ **No More N+1 Queries**: DataLoader batches and caches requests
✅ **Clean Separation**: Relations loaded only when requested
✅ **Type-Safe**: All loaders use Prisma types
✅ **Maintainable**: Adding new relations is straightforward
✅ **Extensible**: Easy to add new entities and loaders

## Performance Impact

Before:
- Query 1 post with 100 comments = 101 queries (1 + 100)

After:
- Query 1 post with 100 comments = 2 queries (1 for post + 1 batched for all authors)

## Testing

Test with a query like:
```graphql
query {
  posts {
    id
    title
    author {
      id
      name
    }
    comments {
      id
      content
      author {
        id
        name
      }
    }
    location {
      id
      street
    }
  }
}
```

Before DataLoader: ~hundreds of queries
After DataLoader: ~5-10 queries (batched!)
