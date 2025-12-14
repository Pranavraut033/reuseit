import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { orderByKeys } from '~/common/base.loader';

import { PrismaService } from '../prisma/prisma.service';
import { User } from '../user/entities/user.entity';
import { Chat } from './entities/chat.entity';
import { Post } from './entities/post.entity';

@Injectable()
export class ChatPostLoader implements NestDataLoader<string, Post | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Post | null> {
    return new DataLoader<string, Post | null>(async (postIds) => {
      const posts = await this.prisma.post.findMany({
        where: { id: { in: [...postIds] } },
      });

      const postMap = new Map(posts.map((post) => [post.id, post]));
      return postIds.map((id) => (postMap.get(id) as any) || null);
    });
  }
}

@Injectable()
export class ChatRequesterLoader implements NestDataLoader<string, User | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(async (userIds) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...userIds] } },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => (userMap.get(id) as any) || null);
    });
  }
}

@Injectable()
export class ChatAuthorLoader implements NestDataLoader<string, User | null> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(async (userIds) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...userIds] } },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => (userMap.get(id) as any) || null);
    });
  }
}

@Injectable()
export class ChatMessageSenderLoader implements NestDataLoader<string, User> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, User> {
    return new DataLoader<string, User>(async (userIds) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...userIds] } },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => (userMap.get(id) as any) || null);
    });
  }
}

@Injectable()
export class ChatLoader implements NestDataLoader<string, Chat> {
  constructor(private readonly prisma: PrismaService) {}

  generateDataLoader(): DataLoader<string, Chat> {
    return new DataLoader<string, Chat>(async (chatIds) => {
      const chats = await this.prisma.chat.findMany({
        where: { id: { in: [...chatIds] } },
      });

      const chatMap = new Map(chats.map((chat) => [chat.id, chat]));
      return chatIds.map((id) => (chatMap.get(id) as any) || null);
    });
  }
}
