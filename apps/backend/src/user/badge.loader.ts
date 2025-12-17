import { Injectable } from '@nestjs/common';
import type { Badge, BadgeAssignment } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys, orderManyByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * DataLoader for Badge entities by ID
 */
@Injectable()
export class BadgeLoader implements NestDataLoader<string, Badge | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Badge | null> {
    return new DataLoader<string, Badge | null>(async (ids) => {
      const badges = await this.prisma.badge.findMany({
        where: { id: { in: [...ids] } },
      });

      return orderByKeys(ids, badges, (badge) => badge.id);
    });
  }
}

/**
 * DataLoader for Badge's users (one-to-many via BadgeAssignment)
 */
@Injectable()
export class BadgeUsersLoader implements NestDataLoader<string, BadgeAssignment[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, BadgeAssignment[]> {
    return new DataLoader<string, BadgeAssignment[]>(async (badgeIds) => {
      const assignments = await this.prisma.badgeAssignment.findMany({
        where: { badgeId: { in: [...badgeIds] } },
        include: {
          user: true,
        },
      });

      return orderManyByKeys(badgeIds, assignments, (assignment) => assignment.badgeId);
    });
  }
}

/**
 * DataLoader for BadgeAssignment's badge (many-to-one)
 */
@Injectable()
export class BadgeAssignmentBadgeLoader implements NestDataLoader<string, Badge | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Badge | null> {
    return new DataLoader<string, Badge | null>(async (badgeIds) => {
      const badges = await this.prisma.badge.findMany({
        where: { id: { in: [...badgeIds] } },
      });

      return orderByKeys(badgeIds, badges, (badge) => badge.id);
    });
  }
}

/**
 * Deprecated: Use canonical `UserLoader` for BadgeAssignment.user lookups
 * instead of maintaining a separate `BadgeAssignmentUserLoader`.
 */

export {};
