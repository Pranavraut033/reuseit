import { Injectable } from '@nestjs/common';
import type { EvenParticipant, Post } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderManyByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * Deprecated: EventCreatorLoader and EventLocationLoader were duplicate
 * single-entity loaders. Use canonical loaders instead:
 *  - `UserLoader` for users
 *  - `LocationLoader` for locations
 */

export {}; // keep module boundary while preserving EventPostsLoader/Participants below

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
