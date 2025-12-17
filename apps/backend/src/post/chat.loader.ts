import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { NestDataLoader } from 'nestjs-dataloader';

import { PrismaService } from '../prisma/prisma.service';
import { Chat } from './entities/chat.entity';

/**
 * Deprecated: chat-specific user/post loaders were duplicating
 * single-entity lookup logic. Use the canonical `UserLoader` and
 * `PostLoader` instead.
 */

export {};

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
