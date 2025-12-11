import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { LocationService } from '~/location/location.service';
import { NotificationService } from '~/notification/notification.service';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { Event } from './entities/event.entity';
import { EventFilterInput, EventFilterType } from './entities/event-filter.entity';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationService: LocationService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createEventInput: CreateEventInput, creatorId?: string): Promise<Event> {
    if (!creatorId) {
      throw new UnauthorizedException('User must be authenticated to create an event');
    }

    const locationId = await this.locationService.verifyOrCreate(
      createEventInput.locationId,
      createEventInput.location,
    );

    // Validate dates
    if (createEventInput.endTime && createEventInput.startTime > createEventInput.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const event = await this.prisma.event.create({
      data: {
        title: createEventInput.title,
        imageUrl: createEventInput.imageUrl,
        description: createEventInput.description,
        startTime: createEventInput.startTime,
        endTime: createEventInput.endTime,
        creatorId,
        locationId,
      },
    });

    await this.notificationService.sendNotificationToUser(
      event.creatorId,
      'Event Created',
      `Your event "${event.title}" was created successfully!`,
      { eventId: event.id },
    );

    return event as unknown as Event;
  }

  async findAll(eventFilter?: EventFilterInput) {
    let locationIds: string[] | undefined;
    let startTimeFilter: any = {};

    // Handle nearby filter
    if (
      eventFilter?.type === EventFilterType.Nearby &&
      eventFilter.latitude &&
      eventFilter.longitude
    ) {
      const radiusInKm = eventFilter.radiusInKm || 5; // Default 5km radius
      const nearbyLocations = await this.locationService.findNearBy(
        eventFilter.latitude,
        eventFilter.longitude,
        radiusInKm,
      );
      if (nearbyLocations && Array.isArray(nearbyLocations)) {
        locationIds = nearbyLocations.map((loc) => loc._id);
      }
    }

    // Handle upcoming filter
    if (eventFilter?.type === EventFilterType.Upcoming) {
      const now = new Date();
      startTimeFilter = { startTime: { gte: now } };
    }

    const whereClause: Prisma.EventWhereInput = { ...startTimeFilter };
    if (locationIds) {
      whereClause.locationId = { in: locationIds };
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
    });

    return events;
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event as unknown as Event;
  }

  async findByCreator(creatorId: string) {
    const events = await this.prisma.event.findMany({
      where: { creatorId },
      orderBy: { startTime: 'asc' },
    });

    return events;
  }

  async findUpcoming() {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: { startTime: { gte: now } },
      orderBy: { startTime: 'asc' },
    });

    return events;
  }

  async update(
    id: string,
    updateEventInput: UpdateEventInput,
    userId: string | undefined,
  ): Promise<Event> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to update an event');
    }

    // Check if event exists and belongs to user
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (existingEvent.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }

    // Validate location if being updated
    if (updateEventInput.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: updateEventInput.locationId },
      });

      if (!location) {
        throw new NotFoundException(`Location with ID ${updateEventInput.locationId} not found`);
      }
    }

    // Validate dates if being updated
    const startTime = updateEventInput.startTime || existingEvent.startTime;
    const endTime =
      updateEventInput.endTime !== undefined ? updateEventInput.endTime : existingEvent.endTime;

    if (endTime && startTime > endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        title: updateEventInput.title,
        imageUrl: updateEventInput.imageUrl,
        description: updateEventInput.description,
        startTime: updateEventInput.startTime,
        endTime: updateEventInput.endTime,
        locationId: updateEventInput.locationId,
      },
    });

    return event as unknown as Event;
  }

  async remove(id: string, userId: string | undefined): Promise<Event> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to delete an event');
    }

    // Check if event exists and belongs to user
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (existingEvent.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    const event = await this.prisma.event.delete({
      where: { id },
    });

    return event as unknown as Event;
  }

  async joinEvent(eventId: string, userId: string | undefined): Promise<Event> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to join an event');
    }

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if user is already a participant
    const existingParticipant = await this.prisma.evenParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('User is already participating in this event');
    }

    // Add user as participant
    await this.prisma.evenParticipant.create({
      data: {
        eventId,
        userId,
      },
    });

    // Return updated event with participants
    return this.findOne(eventId);
  }

  async leaveEvent(eventId: string, userId: string | undefined): Promise<Event> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to leave an event');
    }

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if user is a participant
    const existingParticipant = await this.prisma.evenParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!existingParticipant) {
      throw new BadRequestException('User is not participating in this event');
    }

    // Remove user as participant
    await this.prisma.evenParticipant.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    // Return updated event with participants
    return this.findOne(eventId);
  }
}
