import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCommentInput } from './dto/create-comment.input';
import { PrismaService } from '~/prisma/prisma.service';
import { NotificationService } from '~/notification/notification.service';

describe('CommentService (isolated)', () => {
  let moduleRef: TestingModule;
  let service: CommentService;
  const prismaMockBase: {
    post: { findUnique: jest.Mock };
    comment: { create: jest.Mock };
  } = { post: { findUnique: jest.fn() }, comment: { create: jest.fn() } };
  const notificationMock: Partial<NotificationService> & { sendNotificationToUser: jest.Mock } = {
    sendNotificationToUser: jest.fn(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: prismaMockBase },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();
    service = moduleRef.get<CommentService>(CommentService);
  });

  test('creates a comment and notifies post author when different', async () => {
    prismaMockBase.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'author' });
    prismaMockBase.comment.create.mockResolvedValue({ id: 'c1', content: 'Nice' });

    const input: CreateCommentInput = { content: 'Nice', postId: 'p1' };
    const res = await service.create(input, 'user-1');

    expect(prismaMockBase.comment.create).toHaveBeenCalledWith({
      data: { content: 'Nice', postId: 'p1', authorId: 'user-1' },
    });
    expect(notificationMock.sendNotificationToUser).toHaveBeenCalledWith(
      'author',
      'New Comment',
      expect.stringContaining('Nice'),
      expect.objectContaining({ postId: 'p1', commentId: 'c1' }),
    );
    expect(res).toEqual(expect.objectContaining({ id: 'c1' }));
  });

  test('throws NotFound when post missing and Unauthorized when not authenticated', async () => {
    prismaMockBase.post.findUnique.mockResolvedValue(null);
    await expect(service.create({ content: 'x', postId: 'pX' }, 'u1')).rejects.toThrow(
      NotFoundException,
    );

    // unauthenticated
    prismaMockBase.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'a1' });
    await expect(
      service.create(
        { content: 'x', postId: 'p1' } as CreateCommentInput,
        undefined as unknown as string,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
