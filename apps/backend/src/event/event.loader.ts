import { Injectable } from '@nestjs/common';
import type { EvenParticipant, Location, Post, User } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys, orderManyByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * DataLoader for Event's creator (many-to-one)
 */
@Injectable()
export class EventCreatorLoader implements NestDataLoader<string, User | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(async (creatorIds) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...creatorIds] } },
      });

      return orderByKeys(creatorIds, users, (user) => user.id);
    });
  }
}

/**
 * DataLoader for Event's location (many-to-one)
 */
@Injectable()
export class EventLocationLoader implements NestDataLoader<string, Location | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Location | null> {
    return new DataLoader<string, Location | null>(async (locationIds) => {
      const locations = await this.prisma.location.findMany({
        where: { id: { in: [...locationIds] } },
      });

      return orderByKeys(locationIds, locations, (location) => location.id);
    });
  }
}

/**
 * DataLoader for Event's posts (one-to-many)
 */
@Injectable()
export class EventPostsLoader implements NestDataLoader<string, Post[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Post[]> {
    return new DataLoader<string, Post[]>(async (eventIds) => {
      const posts = await this.prisma.post.findMany({
        where: { eventId: { in: [...eventIds] } },
      });

      return orderManyByKeys(eventIds, posts, (post) => post.eventId || '');
    });
  }
}

/**
 * DataLoader for Event's participants (one-to-many via junction table)
 */
@Injectable()
export class EventParticipantsLoader implements NestDataLoader<string, EvenParticipant[]> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, EvenParticipant[]> {
    return new DataLoader<string, EvenParticipant[]>(async (eventIds) => {
      const participants = await this.prisma.evenParticipant.findMany({
        where: { eventId: { in: [...eventIds] } },
      });

      return orderManyByKeys(eventIds, participants, (participant) => participant.eventId);
    });
  }
}
