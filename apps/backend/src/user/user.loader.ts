import { Injectable } from '@nestjs/common';
import type {
  BadgeAssignment,
  Comment,
  EvenParticipant,
  Event,
  PointsHistory,
  Post,
  User,
  UserArticle,
} from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys, orderManyByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * DataLoader for User entities by ID
 */
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

/**
 * DataLoader for User's posts (one-to-many)
 */
@Injectable()
export class UserPostsLoader implements NestDataLoader<string, Post[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Post[]> {
    return new DataLoader<string, Post[]>(async (userIds) => {
      const posts = await this.prisma.post.findMany({
        where: { authorId: { in: [...userIds] } },
      });

      return orderManyByKeys(userIds, posts, (post) => post.authorId || '');
    });
  }
}

/**
 * DataLoader for User's comments (one-to-many)
 */
@Injectable()
export class UserCommentsLoader implements NestDataLoader<string, Comment[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Comment[]> {
    return new DataLoader<string, Comment[]>(async (userIds) => {
      const comments = await this.prisma.comment.findMany({
        where: { authorId: { in: [...userIds] } },
      });

      return orderManyByKeys(userIds, comments, (comment) => comment.authorId || '');
    });
  }
}

/**
 * DataLoader for User's badges (one-to-many)
 */
@Injectable()
export class UserBadgesLoader implements NestDataLoader<string, BadgeAssignment[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, BadgeAssignment[]> {
    return new DataLoader<string, BadgeAssignment[]>(async (userIds) => {
      const badges = await this.prisma.badgeAssignment.findMany({
        where: { userId: { in: [...userIds] } },
        include: {
          badge: true,
        },
      });

      return orderManyByKeys(userIds, badges, (badge) => badge.userId);
    });
  }
}

/**
 * DataLoader for User's events created (one-to-many)
 */
@Injectable()
export class UserEventsLoader implements NestDataLoader<string, Event[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Event[]> {
    return new DataLoader<string, Event[]>(async (userIds) => {
      const events = await this.prisma.event.findMany({
        where: { creatorId: { in: [...userIds] } },
      });

      return orderManyByKeys(userIds, events, (event) => event.creatorId);
    });
  }
}

/**
 * DataLoader for User's event participations (one-to-many)
 */
@Injectable()
export class UserEventParticipationsLoader implements NestDataLoader<string, EvenParticipant[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, EvenParticipant[]> {
    return new DataLoader<string, EvenParticipant[]>(async (userIds) => {
      const participations = await this.prisma.evenParticipant.findMany({
        where: { userId: { in: [...userIds] } },
      });

      return orderManyByKeys(userIds, participations, (participation) => participation.userId);
    });
  }
}

/**
 * DataLoader for User's points history (one-to-many)
 */
@Injectable()
export class UserPointsHistoryLoader implements NestDataLoader<string, PointsHistory[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, PointsHistory[]> {
    return new DataLoader<string, PointsHistory[]>(async (userIds) => {
      const pointsHistory = await this.prisma.pointsHistory.findMany({
        where: { userId: { in: [...userIds] } },
        orderBy: { createdAt: 'desc' },
      });

      return orderManyByKeys(userIds, pointsHistory, (history) => history.userId);
    });
  }
}

/**
 * DataLoader for User's articles (one-to-many)
 */
@Injectable()
export class UserArticlesLoader implements NestDataLoader<string, UserArticle[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, UserArticle[]> {
    return new DataLoader<string, UserArticle[]>(async (userIds) => {
      const articles = await this.prisma.userArticle.findMany({
        where: { userId: { in: [...userIds] } },
      });

      return orderManyByKeys(userIds, articles, (article) => article.userId);
    });
  }
}
