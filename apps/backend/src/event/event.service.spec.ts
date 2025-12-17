import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { EventModule } from './event.module';
import { PrismaService } from '~/prisma/prisma.service';
import { LocationService } from '~/location/location.service';
import { NotificationService } from '~/notification/notification.service';
import { CreateEventInput } from './dto/create-event.input';
import { UnauthorizedException } from '@nestjs/common';

describe('EventService (isolated)', () => {
  let moduleRef: TestingModule;
  let service: EventService;
  const prismaMock = {
    event: {
      create: jest.fn() as jest.Mock,
      findUnique: jest.fn() as jest.Mock,
      findMany: jest.fn() as jest.Mock,
      update: jest.fn() as jest.Mock,
      delete: jest.fn() as jest.Mock,
    },
    evenParticipant: {
      findUnique: jest.fn() as jest.Mock,
      create: jest.fn() as jest.Mock,
      delete: jest.fn() as jest.Mock,
    },
  } as unknown as {
    event: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    evenParticipant: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock };
  };

  const locationMock: Partial<LocationService> & {
    verifyOrCreate: jest.Mock;
    findNearBy: jest.Mock;
  } = {
    verifyOrCreate: jest.fn(),
    findNearBy: jest.fn(),
  } as unknown as typeof locationMock;

  const notificationMock: Partial<NotificationService> & { sendNotificationToUser: jest.Mock } = {
    sendNotificationToUser: jest.fn(),
  } as unknown as typeof notificationMock;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LocationService, useValue: locationMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = moduleRef.get<EventService>(EventService);
  });

  test('creates an event when authenticated and notifies the creator', async () => {
    const input: CreateEventInput = {
      title: 'Cleanup',
      imageUrl: ['u'],
      description: 'Park cleanup',
      startTime: new Date('2026-01-01T10:00:00Z'),
      endTime: new Date('2026-01-01T12:00:00Z'),
      locationId: undefined,
      location: { name: 'Park' } as any,
    };

    locationMock.verifyOrCreate.mockResolvedValue('loc-1');
    (prismaMock.event.create as jest.Mock).mockResolvedValue({
      id: 'evt-1',
      creatorId: 'user-1',
      title: input.title,
    });

    const res = await service.create(input, 'user-1');

    expect(locationMock.verifyOrCreate).toHaveBeenCalledWith(undefined, input.location);
    expect(prismaMock.event.create).toHaveBeenCalled();
    expect(notificationMock.sendNotificationToUser).toHaveBeenCalledWith(
      'user-1',
      'Event Created',
      expect.stringContaining(input.title),
      expect.objectContaining({ eventId: 'evt-1' }),
    );
    expect(res).toEqual(expect.objectContaining({ id: 'evt-1' }));
  });

  test('throws Unauthorized when creating without user', async () => {
    await expect(
      service.create({} as CreateEventInput, undefined as unknown as string),
    ).rejects.toThrow(UnauthorizedException);
  });

  test('allows a user to join an event and prevents double-join', async () => {
    // first call: find event exists
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'evt-2' });
    // participant not present
    (prismaMock.evenParticipant.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prismaMock.evenParticipant.create as jest.Mock).mockResolvedValue({
      eventId: 'evt-2',
      userId: 'u1',
    });
    // subsequent findOne (called by findOne) returns event with participants
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'evt-2',
      participants: [{ userId: 'u1' }],
    });

    const joined = await service.joinEvent('evt-2', 'u1');

    expect(prismaMock.evenParticipant.create).toHaveBeenCalledWith({
      data: { eventId: 'evt-2', userId: 'u1' },
    });
    expect(joined).toEqual(expect.objectContaining({ id: 'evt-2' }));

    // simulate already a participant
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'evt-2' });
    (prismaMock.evenParticipant.findUnique as jest.Mock).mockResolvedValueOnce({
      eventId: 'evt-2',
      userId: 'u1',
    });

    await expect(service.joinEvent('evt-2', 'u1')).rejects.toThrow();
  });

  test('allows leaving an event and prevents leaving when not a participant', async () => {
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'evt-3' });
    (prismaMock.evenParticipant.findUnique as jest.Mock).mockResolvedValueOnce({
      eventId: 'evt-3',
      userId: 'u2',
    });
    (prismaMock.evenParticipant.delete as jest.Mock).mockResolvedValue({});
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'evt-3',
      participants: [],
    });

    const res = await service.leaveEvent('evt-3', 'u2');
    expect(prismaMock.evenParticipant.delete).toHaveBeenCalled();
    expect(res).toEqual(expect.objectContaining({ id: 'evt-3' }));

    // leaving when not participant
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'evt-3' });
    (prismaMock.evenParticipant.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.leaveEvent('evt-3', 'u2')).rejects.toThrow();
  });

  test('forbids update/remove when not creator', async () => {
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValue({
      id: 'evt-4',
      creatorId: 'owner',
    });

    await expect(
      service.update('evt-4', { title: 'x' } as unknown as any, 'someone'),
    ).rejects.toThrow();
    await expect(service.remove('evt-4', 'someone')).rejects.toThrow();
  });
});
