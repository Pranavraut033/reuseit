import { Injectable } from '@nestjs/common';
import type { Event, Location, Post } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys, orderManyByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * Deprecated: `LocationCreatorLoader` duplicated user lookups.
 * Use the canonical `UserLoader` for user-by-id lookups instead.
 */

export {};

/**
 * Canonical DataLoader for Location entities by ID
 * This keeps single-entity lookup centralized and reusable across the codebase
 */
@Injectable()
export class LocationLoader implements NestDataLoader<string, Location | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Location | null> {
    return new DataLoader<string, Location | null>(async (ids) => {
      const locations = await this.prisma.location.findMany({
        where: { id: { in: [...ids] } },
      });

      return orderByKeys(ids, locations, (location) => location.id);
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
