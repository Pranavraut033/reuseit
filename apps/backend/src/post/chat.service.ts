import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { NotificationService } from '~/notification/notification.service';

import { PrismaService } from '../prisma/prisma.service';
import {
  BlockUserInput,
  CreateChatInput,
  CreateChatMessageInput,
  ReportChatInput,
} from './dto/create-chat.input';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createChatInput: CreateChatInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to create a chat');
    }

    // Verify that the post exists and get the author
    const post = await this.prisma.post.findUnique({
      where: { id: createChatInput.postId },
      select: { id: true, authorId: true, title: true },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${createChatInput.postId} not found`);
    }

    if (!post.authorId) {
      throw new ForbiddenException('Cannot create chat for post without author');
    }

    // Check if user is not the post author
    if (post.authorId === userId) {
      throw new ForbiddenException('Cannot create chat with yourself');
    }

    // Check if author has blocked this user
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: post.authorId,
          blockedId: userId,
        },
      },
    });

    if (block) {
      throw new ForbiddenException('You have been blocked by this user');
    }

    // Check if chat already exists
    const existingChat = await this.prisma.chat.findUnique({
      where: {
        postId_requesterId: {
          postId: createChatInput.postId,
          requesterId: userId,
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const chat = await this.prisma.chat.create({
      data: {
        postId: createChatInput.postId,
        requesterId: userId,
        authorId: post.authorId,
      },
    });

    // Notify post author about new chat request
    await this.notificationService.sendNotificationToUser(
      post.authorId,
      'New Chat Request',
      `Someone is interested in your post: "${post.title.slice(0, 50)}"`,
      { postId: post.id, chatId: chat.id },
    );

    return chat;
  }

  async findByPostAndUser(postId: string, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated');
    }

    const chat = await this.prisma.chat.findUnique({
      where: {
        postId_requesterId: {
          postId,
          requesterId: userId,
        },
      },
      include: {
        messages: {
          include: {
            sender: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        post: true,
        requester: true,
        author: true,
      },
    });

    if (!chat) {
      return null;
    }

    // Check if user is authorized to view this chat
    if (chat.requesterId !== userId && chat.authorId !== userId) {
      throw new ForbiddenException('Not authorized to view this chat');
    }

    return chat;
  }

  async findById(chatId: string, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated');
    }

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          include: {
            sender: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        post: true,
        requester: true,
        author: true,
      },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Check if user is authorized to view this chat
    if (chat.requesterId !== userId && chat.authorId !== userId) {
      throw new ForbiddenException('Not authorized to view this chat');
    }

    return chat;
  }

  async findChatsForUser(userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated');
    }

    return this.prisma.chat.findMany({
      where: {
        OR: [{ requesterId: userId }, { authorId: userId }],
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async createMessage(createMessageInput: CreateChatMessageInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to send a message');
    }

    // Verify chat exists and user is authorized
    const chat = await this.prisma.chat.findUnique({
      where: { id: createMessageInput.chatId },
      select: { id: true, requesterId: true, authorId: true, post: { select: { title: true } } },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${createMessageInput.chatId} not found`);
    }

    // Check if user is authorized to send messages in this chat
    if (chat.requesterId !== userId && chat.authorId !== userId) {
      throw new ForbiddenException('Not authorized to send messages in this chat');
    }

    // Create message
    const message = await this.prisma.chatMessage.create({
      data: {
        chatId: createMessageInput.chatId,
        senderId: userId,
        content: createMessageInput.content,
      },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: createMessageInput.chatId },
      data: { updatedAt: new Date() },
    });

    // Notify the other participant
    const recipientId = chat.requesterId === userId ? chat.authorId : chat.requesterId;
    await this.notificationService.sendNotificationToUser(
      recipientId,
      'New Message',
      `New message in chat about: "${chat.post.title.slice(0, 50)}"`,
      { chatId: chat.id, messageId: message.id },
    );

    return message;
  }

  async getChatCountForPost(postId: string) {
    return this.prisma.chat.count({
      where: { postId },
    });
  }

  async getMessagesForChat(
    chatId: string,
    options?: { take?: number; orderBy?: string },
  ): Promise<ChatMessage[]> {
    const orderBy =
      options?.orderBy === 'createdAt'
        ? { createdAt: 'asc' as const }
        : { createdAt: 'desc' as const };
    const take = options?.take || undefined;

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy,
      take,
    });

    return messages as ChatMessage[];
  }

  async blockUser(blockUserInput: BlockUserInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to block users');
    }

    // Check if user is trying to block themselves
    if (userId === blockUserInput.userId) {
      throw new ForbiddenException('Cannot block yourself');
    }

    // Check if block already exists
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: blockUserInput.userId,
        },
      },
    });

    if (existingBlock) {
      return true; // Already blocked
    }

    // Create block
    await this.prisma.userBlock.create({
      data: {
        blockerId: userId,
        blockedId: blockUserInput.userId,
      },
    });

    return true;
  }

  async deleteChat(chatId: string, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to delete chats');
    }

    // Find chat and check permissions
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, authorId: true, requesterId: true },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${chatId} not found`);
    }

    // Only author can delete chat
    if (chat.authorId !== userId) {
      throw new ForbiddenException('Only the post author can delete this chat');
    }

    // Delete chat (cascade will delete messages and reports)
    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    return true;
  }

  async reportChat(reportChatInput: ReportChatInput, userId: string | undefined) {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to report chats');
    }

    // Find chat and check permissions
    const chat = await this.prisma.chat.findUnique({
      where: { id: reportChatInput.chatId },
      select: { id: true, authorId: true, requesterId: true },
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${reportChatInput.chatId} not found`);
    }

    // Only author can report chat
    if (chat.authorId !== userId) {
      throw new ForbiddenException('Only the post author can report this chat');
    }

    // Check if report already exists
    const existingReport = await this.prisma.chatReport.findFirst({
      where: {
        chatId: reportChatInput.chatId,
        reporterId: userId,
      },
    });

    if (existingReport) {
      return true; // Already reported
    }

    // Create report
    await this.prisma.chatReport.create({
      data: {
        chatId: reportChatInput.chatId,
        reporterId: userId,
        reason: reportChatInput.reason,
      },
    });

    return true;
  }
}
