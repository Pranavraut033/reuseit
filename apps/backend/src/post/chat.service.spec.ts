import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '~/prisma/prisma.service';
import { NotificationService } from '~/notification/notification.service';
import { CreateChatInput, CreateChatMessageInput } from './dto/create-chat.input';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ChatService (isolated)', () => {
  let moduleRef: TestingModule;
  let service: ChatService;
  const prismaMockBase: {
    post: { findUnique: jest.Mock };
    userBlock: { findUnique: jest.Mock };
    chat: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    chatMessage?: { create: jest.Mock };
  } = {
    post: { findUnique: jest.fn() as jest.Mock },
    userBlock: { findUnique: jest.fn() as jest.Mock },
    chat: {
      findUnique: jest.fn() as jest.Mock,
      create: jest.fn() as jest.Mock,
      update: jest.fn() as jest.Mock,
    },
  };
  const notificationMock: Partial<NotificationService> & { sendNotificationToUser: jest.Mock } = {
    sendNotificationToUser: jest.fn(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prismaMockBase },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = moduleRef.get<ChatService>(ChatService);
  });

  test('forbids creating a chat with yourself or when post missing/without author', async () => {
    prismaMockBase.post.findUnique.mockResolvedValue(null);
    await expect(service.create({ postId: 'p1' } as CreateChatInput, 'u1')).rejects.toThrow(
      NotFoundException,
    );

    prismaMockBase.post!.findUnique.mockResolvedValue({ id: 'p2', authorId: null });
    await expect(service.create({ postId: 'p2' } as CreateChatInput, 'u1')).rejects.toThrow(
      ForbiddenException,
    );

    prismaMockBase.post!.findUnique.mockResolvedValue({ id: 'p3', authorId: 'u1' });
    await expect(service.create({ postId: 'p3' } as CreateChatInput, 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  test('prevents creation if blocked, returns existing chat if present, otherwise creates and notifies', async () => {
    const post = { id: 'p4', authorId: 'author', title: 'Thingy' };

    // blocked
    prismaMockBase.post.findUnique.mockResolvedValue(post);
    prismaMockBase.userBlock.findUnique.mockResolvedValue({});
    await expect(service.create({ postId: 'p4' } as CreateChatInput, 'u2')).rejects.toThrow(
      ForbiddenException,
    );

    // existing chat
    prismaMockBase.userBlock.findUnique.mockResolvedValue(null);
    prismaMockBase.chat.findUnique.mockResolvedValue({
      id: 'chat-1',
      postId: 'p4',
      requesterId: 'u2',
    });
    const existing = await service.create({ postId: 'p4' } as CreateChatInput, 'u2');
    expect(existing).toEqual(expect.objectContaining({ id: 'chat-1' }));

    // create new chat without message -> notify
    prismaMockBase.chat.findUnique.mockResolvedValue(null);
    prismaMockBase.chat.create.mockResolvedValue({ id: 'chat-2', postId: 'p4', requesterId: 'u2' });
    const created = await service.create({ postId: 'p4' } as CreateChatInput, 'u2');
    expect(prismaMockBase.chat.create).toHaveBeenCalled();
    expect(notificationMock.sendNotificationToUser).toHaveBeenCalledWith(
      'author',
      'New Chat Request',
      expect.stringContaining('Thingy'),
      expect.objectContaining({ postId: 'p4', chatId: 'chat-2' }),
    );
    expect(created).toEqual(expect.objectContaining({ id: 'chat-2' }));
  });

  test('requires authentication when creating messages and notifies recipient', async () => {
    await expect(
      service.createMessage(
        { chatId: 'c1', content: 'hi' } as CreateChatMessageInput,
        undefined as unknown as string,
      ),
    ).rejects.toThrow(UnauthorizedException);

    // chat exists and user is authorized
    prismaMockBase.chat.findUnique.mockResolvedValue({
      id: 'c1',
      requesterId: 'u1',
      authorId: 'u2',
      post: { title: 'T' },
    });
    prismaMockBase.chatMessage = { create: jest.fn() } as any;
    prismaMockBase.chatMessage!.create.mockResolvedValue({ id: 'm1', content: 'hi' });
    prismaMockBase.chat.update = jest.fn().mockResolvedValue({});

    const msg = await service.createMessage(
      { chatId: 'c1', content: 'hi' } as CreateChatMessageInput,
      'u1',
    );
    expect(prismaMockBase.chatMessage!.create).toHaveBeenCalledWith({
      data: { chatId: 'c1', senderId: 'u1', content: 'hi' },
    });
    expect(notificationMock.sendNotificationToUser).toHaveBeenCalled();
    expect(msg).toEqual(expect.objectContaining({ id: 'm1' }));
  });
});
