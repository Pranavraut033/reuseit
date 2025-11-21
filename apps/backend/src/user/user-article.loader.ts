import { Injectable } from '@nestjs/common';
import type { Post, User } from '@prisma/client';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys } from '~/common/base.loader';
import { PrismaService } from '~/prisma/prisma.service';

/**
 * DataLoader for UserArticle's user (many-to-one)
 */
@Injectable()
export class UserArticleUserLoader implements NestDataLoader<string, User | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(async (userIds) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...userIds] } },
      });

      return orderByKeys(userIds, users, (user) => user.id);
    });
  }
}

/**
 * DataLoader for UserArticle's post (many-to-one)
 */
@Injectable()
export class UserArticlePostLoader implements NestDataLoader<string, Post | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Post | null> {
    return new DataLoader<string, Post | null>(async (postIds) => {
      const validIds = postIds.filter((id) => id !== null && id !== undefined);
      const posts = await this.prisma.post.findMany({
        where: { id: { in: [...validIds] } },
      });

      return orderByKeys(postIds, posts, (post) => post.id);
    });
  }
}
