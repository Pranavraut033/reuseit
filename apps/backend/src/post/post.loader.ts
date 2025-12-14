import { Injectable } from '@nestjs/common';
import type { Comment, Event, Location, Post, User, UserArticle } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys, orderManyByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * DataLoader for Post entities by ID
 */
@Injectable()
export class PostLoader implements NestDataLoader<string, Post | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Post | null> {
    return new DataLoader<string, Post | null>(async (ids) => {
      const posts = await this.prisma.post.findMany({
        where: { id: { in: [...ids] } },
      });

      return orderByKeys(ids, posts, (post) => post.id);
    });
  }
}

/**
 * DataLoader for Post's author (many-to-one)
 */
@Injectable()
export class PostAuthorLoader implements NestDataLoader<string, User | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(async (authorIds) => {
      const validIds = authorIds.filter((id) => id !== null && id !== undefined);
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...validIds] } },
      });

      return orderByKeys(authorIds, users, (user) => user.id);
    });
  }
}

/**
 * DataLoader for Post's location (many-to-one)
 */
@Injectable()
export class PostLocationLoader implements NestDataLoader<string, Location | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Location | null> {
    return new DataLoader<string, Location | null>(async (locationIds) => {
      const validIds = locationIds.filter((id) => id !== null && id !== undefined);
      const locations = await this.prisma.location.findMany({
        where: { id: { in: [...validIds] } },
      });

      return orderByKeys(locationIds, locations, (location) => location.id);
    });
  }
}

/**
 * DataLoader for Post's event (many-to-one)
 */
@Injectable()
export class PostEventLoader implements NestDataLoader<string, Event | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Event | null> {
    return new DataLoader<string, Event | null>(async (eventIds) => {
      const validIds = eventIds.filter((id) => id !== null && id !== undefined);
      const events = await this.prisma.event.findMany({
        where: { id: { in: [...validIds] } },
      });

      return orderByKeys(eventIds, events, (event) => event.id);
    });
  }
}

/**
 * DataLoader for Post's user articles (one-to-many)
 */
@Injectable()
export class PostUserArticlesLoader implements NestDataLoader<string, UserArticle[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, UserArticle[]> {
    return new DataLoader<string, UserArticle[]>(async (postIds) => {
      const articles = await this.prisma.userArticle.findMany({
        where: { postId: { in: [...postIds] } },
      });

      return orderManyByKeys(postIds, articles, (article) => article.postId || '');
    });
  }
}

/**
 * DataLoader for Post's like count
 */
@Injectable()
export class PostLikeCountLoader implements NestDataLoader<string, number> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, number> {
    return new DataLoader<string, number>(async (postIds) => {
      const likes = await this.prisma.like.groupBy({
        by: ['postId'],
        where: { postId: { in: [...postIds] } },
        _count: { postId: true },
      });

      const countMap = new Map(likes.map((l) => [l.postId, l._count.postId]));
      return postIds.map((id) => countMap.get(id) || 0);
    });
  }
}

/**
 * DataLoader for Post's chat count
 */
@Injectable()
export class PostChatCountLoader implements NestDataLoader<string, number> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, number> {
    return new DataLoader<string, number>(async (postIds) => {
      const chats = await this.prisma.chat.groupBy({
        by: ['postId'],
        where: { postId: { in: [...postIds] } },
        _count: { postId: true },
      });

      const countMap = new Map(chats.map((c) => [c.postId, c._count.postId]));
      return postIds.map((id) => countMap.get(id) || 0);
    });
  }
}

/**
 * DataLoader to check if current user liked a post
 * Note: This loader requires userId context, so it should be instantiated per-request
 */
@Injectable()
export class PostLikedByUserLoader {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a dataloader for a specific user
   */
  createLoader(userId: string | undefined): DataLoader<string, boolean> {
    return new DataLoader<string, boolean>(async (postIds) => {
      if (!userId) {
        return postIds.map(() => false);
      }

      const likes = await this.prisma.like.findMany({
        where: {
          userId,
          postId: { in: [...postIds] },
        },
      });

      const likedPostIds = new Set(likes.map((l) => l.postId));
      return postIds.map((id) => likedPostIds.has(id));
    });
  }
}
