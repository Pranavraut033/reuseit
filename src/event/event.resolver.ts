import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { EventService } from './event.service';
import { Event } from './entities/event.entity';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { User } from '../user/entities/user.entity';

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
    return this.eventService.update(
      updateEventInput.id,
      updateEventInput,
      req.user?.id,
    );
  }

  @Mutation(() => Event)
  removeEvent(
    @Args('id', { type: () => String }) id: string,
    @Context('req') req: { user?: User },
  ) {
    return this.eventService.remove(id, req.user?.id);
  }
}
