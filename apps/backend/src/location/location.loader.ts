import { Injectable } from '@nestjs/common';
import type { Event, Post, User } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys, orderManyByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * DataLoader for Location's creator (many-to-one)
 */
@Injectable()
export class LocationCreatorLoader implements NestDataLoader<string, User | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(async (userIds) => {
      const validIds = userIds.filter((id) => id !== null && id !== undefined);
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...validIds] } },
      });

      return orderByKeys(userIds, users, (user) => user.id);
    });
  }
}

/**
 * DataLoader for Location's posts (one-to-many)
 */
@Injectable()
export class LocationPostsLoader implements NestDataLoader<string, Post[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Post[]> {
    return new DataLoader<string, Post[]>(async (locationIds) => {
      const posts = await this.prisma.post.findMany({
        where: { locationId: { in: [...locationIds] } },
      });

      return orderManyByKeys(locationIds, posts, (post) => post.locationId || '');
    });
  }
}

/**
 * DataLoader for Location's events (one-to-many)
 */
@Injectable()
export class LocationEventsLoader implements NestDataLoader<string, Event[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Event[]> {
    return new DataLoader<string, Event[]>(async (locationIds) => {
      const events = await this.prisma.event.findMany({
        where: { locationId: { in: [...locationIds] } },
      });

      return orderManyByKeys(locationIds, events, (event) => event.locationId);
    });
  }
}
