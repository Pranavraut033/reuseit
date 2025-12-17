import { Test } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '~/prisma/prisma.service';
import { LocationService } from '~/location/location.service';
import { PointsService } from '~/points/points.service';
import { NotificationService } from '~/notification/notification.service';

describe('PostService (isolated)', () => {
  let moduleRef: import('@nestjs/testing').TestingModule;
  let service: PostService;
  let prismaMockBase: {
    post: { findMany: jest.Mock; create?: jest.Mock; findUnique?: jest.Mock };
    like: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock };
    chatMessage?: { count: jest.Mock };
  };
  let locationMock: Partial<LocationService> & {
    verifyOrCreate?: jest.Mock;
    findNearBy?: jest.Mock;
  };
  let pointsMock: Partial<PointsService> & { addPoints?: jest.Mock };
  let notificationMock: Partial<NotificationService> & { sendNotificationToUser?: jest.Mock };

  beforeEach(async () => {
    prismaMockBase = {
      post: { findMany: jest.fn() },
      like: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    };
    locationMock = {
      verifyOrCreate: jest.fn(),
      findNearBy: jest.fn(),
    } as unknown as typeof locationMock;
    pointsMock = { addPoints: jest.fn() } as unknown as typeof pointsMock;
    notificationMock = { sendNotificationToUser: jest.fn() } as unknown as typeof notificationMock;

    moduleRef = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: prismaMockBase },
        { provide: LocationService, useValue: locationMock },
        { provide: PointsService, useValue: pointsMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = moduleRef.get(PostService);
  });

  test('should search by title/description/tags when search is provided', async () => {
    prismaMockBase.post.findMany.mockResolvedValue([]);

    await service.findAll(10, 0, { search: 'bike' });

    expect(prismaMockBase.post.findMany).toHaveBeenCalled();
    const calledWith = prismaMockBase.post.findMany.mock.calls[0][0] || {};
    expect(calledWith.where).toBeDefined();
    const and = calledWith.where.AND as { OR?: unknown }[];
    expect(and).toBeDefined();
    const searchClause = and.find((c) => c && c.OR !== undefined);
    expect(searchClause).toBeDefined();
    expect((searchClause as any).OR as any[]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: expect.any(Object) }),
        expect.objectContaining({ description: expect.any(Object) }),
        expect.objectContaining({ tags: expect.any(Object) }),
      ]),
    );
  });

  test('creates a post when authenticated and awards points + notifies', async () => {
    const createSpy = jest.fn().mockResolvedValue({ id: 'p1', title: 'Thing' });
    prismaMockBase.post = { findMany: jest.fn(), create: createSpy } as any;
    locationMock.verifyOrCreate!.mockResolvedValue('loc-1');
    pointsMock.addPoints!.mockResolvedValue(undefined);
    notificationMock.sendNotificationToUser!.mockResolvedValue(undefined);

    const CreateLocation = require('../location/dto/create-location.input').CreateLocationInput;
    const input = {
      title: 'Thing',
      location: {
        street: 's',
        country: 'C',
        coordinates: [0, 0],
        type: require('../location/entities/location-type.entity').LocationType.OTHER,
      },
      anonymous: false,
      postType: require('./entities/post-type.entity').PostType.GIVEAWAY,
      tags: [],
    } as unknown as Record<string, unknown>;

    const res = await service.create(input as any, 'user-1');

    expect(locationMock.verifyOrCreate).toHaveBeenCalledWith(undefined, expect.any(Object), true);
    expect(createSpy).toHaveBeenCalled();
    expect(pointsMock.addPoints).toHaveBeenCalledWith('user-1', 'CREATE_POST');
    expect(notificationMock.sendNotificationToUser).toHaveBeenCalledWith(
      'user-1',
      'Post Created',
      expect.stringContaining('Thing'),
      expect.objectContaining({ postId: 'p1' }),
    );
    expect(res).toEqual(expect.objectContaining({ id: 'p1' }));
  });

  test('throws when creating post without auth', async () => {
    await expect(service.create({} as any, undefined)).rejects.toThrow();
  });

  test('toggles like correctly (create and delete)', async () => {
    const prismaMockBase2 = {
      ...prismaMockBase,
      post: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: 'pX' }),
      },
      like: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    };
    Object.assign(prismaMockBase, prismaMockBase2);
    prismaMockBase.post.findMany.mockResolvedValue([]);

    // No existing like -> create
    prismaMockBase.like.findUnique.mockResolvedValueOnce(null);
    prismaMockBase.like.create.mockResolvedValueOnce({ id: 'like-1' });
    const liked = await service.togglePostLike('pX', 'u1');
    expect(liked).toBe(true);
    expect(prismaMockBase.like.create).toHaveBeenCalledWith({
      data: { userId: 'u1', postId: 'pX' },
    });

    // Existing like -> delete
    prismaMockBase.like.findUnique.mockResolvedValueOnce({ id: 'like-1' });
    prismaMockBase.like.delete.mockResolvedValueOnce({});
    const unliked = await service.togglePostLike('pX', 'u1');
    expect(unliked).toBe(false);
    expect(prismaMockBase.like.delete).toHaveBeenCalled();
  });

  test('isLikedByUser returns false when no user provided', async () => {
    const res = await service.isLikedByUser('p1', undefined);
    expect(res).toBe(false);
  });

  test('hasChatWithCurrentUser returns based on message count', async () => {
    const chatCountMock = jest.fn().mockResolvedValue(2);
    prismaMockBase.chatMessage = { count: chatCountMock } as any;
    const res = await service.hasChatWithCurrentUser('p1', 'u1');
    expect(res).toBe(true);
  });
});
