import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { Cache } from 'cache-manager';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { CacheQuery, InvalidateCache } from '~/decorators/cache.decorator';
import { Location } from '~/location/entities/location.entity';
import { Post } from '~/post/entities/post.entity';

import { User } from '../user/entities/user.entity';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { Event } from './entities/event.entity';
import { EventFilterInput } from './entities/event-filter.entity';
import { EvenParticipant } from './entities/event-participant.entity';
import {
  EventCreatorLoader,
  EventLocationLoader,
  EventParticipantsLoader,
  EventPostsLoader,
} from './event.loader';
import { EventService } from './event.service';

@Resolver(() => Event)
export class EventResolver {
  constructor(
    private readonly eventService: EventService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Mutation(() => Event)
  @InvalidateCache((result: Event) => [
    'events',
    'upcomingEvents',
    `eventsByCreator:${result.creator.id}`,
    `event:${result.id}`,
  ])
  createEvent(
    @Args('createEventInput') createEventInput: CreateEventInput,
    @Context('req') req: { user?: User },
  ) {
    return this.eventService.create(createEventInput, req.user?.id);
  }

  @Query(() => [Event], { name: 'events' })
  @CacheQuery(() => 'events', 300)
  findAll(
    @Args('eventFilter', { type: () => EventFilterInput, nullable: true })
    eventFilter?: EventFilterInput,
  ) {
    return this.eventService.findAll(eventFilter);
  }

  @Query(() => Event, { name: 'event' })
  @CacheQuery((id: string) => `event:${id}`, 300)
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.eventService.findOne(id);
  }

  @Query(() => [Event], { name: 'eventsByCreator' })
  @CacheQuery((creatorId: string) => `eventsByCreator:${creatorId}`, 300)
  findByCreator(@Args('creatorId', { type: () => String }) creatorId: string) {
    return this.eventService.findByCreator(creatorId);
  }

  @Query(() => [Event], { name: 'upcomingEvents' })
  @CacheQuery(() => 'upcomingEvents', 300)
  findUpcoming() {
    return this.eventService.findUpcoming();
  }

  @Mutation(() => Event)
  @InvalidateCache((result: Event) => [
    'events',
    'upcomingEvents',
    `eventsByCreator:${result.creator.id}`,
    `event:${result.id}`,
  ])
  updateEvent(
    @Args('updateEventInput') updateEventInput: UpdateEventInput,
    @Context('req') req: { user?: User },
  ): Promise<Event> {
    return this.eventService.update(updateEventInput.id, updateEventInput, req.user?.id);
  }

  @Mutation(() => Event)
  @InvalidateCache((result: Event) => [
    'events',
    'upcomingEvents',
    `eventsByCreator:${result.creator.id}`,
    `event:${result.id}`,
  ])
  removeEvent(
    @Args('id', { type: () => String }) id: string,
    @Context('req') req: { user?: User },
  ): Promise<Event> {
    return this.eventService.remove(id, req.user?.id);
  }

  @Mutation(() => Event)
  @InvalidateCache((result: Event) => [`event:${result.id}`])
  joinEvent(
    @Args('eventId', { type: () => String }) eventId: string,
    @Context('req') req: { user?: User },
  ): Promise<Event> {
    return this.eventService.joinEvent(eventId, req.user?.id);
  }

  @Mutation(() => Event)
  @InvalidateCache((result: Event) => [`event:${result.id}`])
  leaveEvent(
    @Args('eventId', { type: () => String }) eventId: string,
    @Context('req') req: { user?: User },
  ): Promise<Event> {
    return this.eventService.leaveEvent(eventId, req.user?.id);
  }

  // Field resolvers for relations
  @ResolveField('creator', () => User)
  async creator(
    @Parent() event: Event & { creatorId: string },
    @Loader(EventCreatorLoader) loader: DataLoader<string, User | null>,
  ): Promise<User | null> {
    return loader.load(event.creatorId);
  }

  @ResolveField('location', () => Location)
  async location(
    @Parent() event: Event & { locationId: string },
    @Loader(EventLocationLoader) loader: DataLoader<string, Location | null>,
  ): Promise<Location | null> {
    return loader.load(event.locationId);
  }

  @ResolveField('posts', () => [Post])
  async posts(
    @Parent() event: Event,
    @Loader(EventPostsLoader) loader: DataLoader<string, Post[]>,
  ): Promise<Post[]> {
    return loader.load(event.id);
  }

  @ResolveField('participants', () => [EvenParticipant], { nullable: true })
  async participants(
    @Parent() event: Event,
    @Loader(EventParticipantsLoader) loader: DataLoader<string, EvenParticipant[]>,
  ): Promise<EvenParticipant[]> {
    return loader.load(event.id);
  }
}
