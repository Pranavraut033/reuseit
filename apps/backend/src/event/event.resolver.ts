import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { Location } from '~/location/entities/location.entity';
import { Post } from '~/post/entities/post.entity';

import { User } from '../user/entities/user.entity';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { Event } from './entities/event.entity';
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
  constructor(private readonly eventService: EventService) {}

  @Mutation(() => Event)
  createEvent(
    @Args('createEventInput') createEventInput: CreateEventInput,
    @Context('req') req: { user?: User },
  ) {
    return this.eventService.create(createEventInput, req.user?.id);
  }

  @Query(() => [Event], { name: 'events' })
  findAll() {
    return this.eventService.findAll();
  }

  @Query(() => Event, { name: 'event' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.eventService.findOne(id);
  }

  @Query(() => [Event], { name: 'eventsByCreator' })
  findByCreator(@Args('creatorId', { type: () => String }) creatorId: string) {
    return this.eventService.findByCreator(creatorId);
  }

  @Query(() => [Event], { name: 'upcomingEvents' })
  findUpcoming() {
    return this.eventService.findUpcoming();
  }

  @Mutation(() => Event)
  updateEvent(
    @Args('updateEventInput') updateEventInput: UpdateEventInput,
    @Context('req') req: { user?: User },
  ) {
    return this.eventService.update(updateEventInput.id, updateEventInput, req.user?.id);
  }

  @Mutation(() => Event)
  removeEvent(
    @Args('id', { type: () => String }) id: string,
    @Context('req') req: { user?: User },
  ) {
    return this.eventService.remove(id, req.user?.id);
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
