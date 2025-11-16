import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { PrismaService } from '../prisma/prisma.service';
import { Event } from './entities/event.entity';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventInput: CreateEventInput, userId: string | undefined): Promise<Event> {
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to create an event');
    }

    // Verify that the location exists
    const location = await this.prisma.location.findUnique({
      where: { id: createEventInput.locationId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${createEventInput.locationId} not found`);
    }

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
        locationId: createEventInput.locationId,
        creatorId: userId,
      },
      include: {
        creator: true,
        location: true,
        post: true,
        participants: true,
      },
    });

    return event as any;
  }

  async findAll(): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      include: {
        creator: true,
        location: true,
        post: true,
        participants: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return events as any;
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: true,
        location: true,
        post: true,
        participants: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event as any;
  }

  async findByCreator(creatorId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: { creatorId },
      include: {
        creator: true,
        location: true,
        post: true,
        participants: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return events as any;
  }

  async findUpcoming(): Promise<Event[]> {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        startTime: {
          gte: now,
        },
      },
      include: {
        creator: true,
        location: true,
        post: true,
        participants: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return events as any;
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
      include: {
        creator: true,
        location: true,
        post: true,
        participants: true,
      },
    });

    return event as any;
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
      include: {
        creator: true,
        location: true,
        post: true,
        participants: true,
      },
    });

    return event as any;
  }
}
