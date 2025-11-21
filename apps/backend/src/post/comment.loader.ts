import { Injectable } from '@nestjs/common';
import type { Post, User } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * DataLoader for Comment's author (many-to-one)
 */
@Injectable()
export class CommentAuthorLoader implements NestDataLoader<string, User | null> {
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
 * DataLoader for Comment's post (many-to-one)
 */
@Injectable()
export class CommentPostLoader implements NestDataLoader<string, Post | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Post | null> {
    return new DataLoader<string, Post | null>(async (postIds) => {
      const posts = await this.prisma.post.findMany({
        where: { id: { in: [...postIds] } },
      });

      return orderByKeys(postIds, posts, (post) => post.id);
    });
  }
}
