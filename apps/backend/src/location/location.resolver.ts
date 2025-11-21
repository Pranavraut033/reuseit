import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { CurrentUser } from '~/decorators/CurrentUser';
import { Post } from '~/post/entities/post.entity';
import { User } from '~/user/entities/user.entity';

import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { Location } from './entities/location.entity';
import {
  LocationCreatorLoader,
  LocationEventsLoader,
  LocationPostsLoader,
} from './location.loader';
import { LocationService } from './location.service';

@Resolver(() => Location)
export class LocationResolver {
  constructor(private readonly locationService: LocationService) {}

  @Query(() => [Location], { name: 'locations' })
  findAll() {
    return this.locationService.findAll();
  }

  @Query(() => Location, { name: 'location' })
  findNearby(
    @Args('latitude', { type: () => Number }) latitude: number,
    @Args('longitude', { type: () => Number }) longitude: number,
    @Args('radiusInKm', { type: () => Number, nullable: true }) radiusInKm?: number,
  ) {
    // Implementation for finding nearby locations can be added here
    return this.locationService.findNearBy(latitude, longitude, radiusInKm); // Placeholder implementation
  }

  @Query(() => Location, { name: 'location' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.locationService.findOne(id);
  }

  @Mutation(() => Location)
  createLocation(
    @Args('createLocationInput') createLocationInput: CreateLocationInput,
    @CurrentUser() user?: User,
  ) {
    return this.locationService.create(createLocationInput, user?.id);
  }

  @Mutation(() => Location)
  updateLocation(@Args('updateLocationInput') updateLocationInput: UpdateLocationInput) {
    return this.locationService.update(updateLocationInput);
  }

  @Mutation(() => Location)
  removeLocation(@Args('id', { type: () => String }) id: string) {
    return this.locationService.remove(id);
  }

  // Field resolvers for relations
  @ResolveField('createdBy', () => User, { nullable: true })
  async createdBy(
    @Parent() location: Location & { userId?: string | null },
    @Loader(LocationCreatorLoader) loader: DataLoader<string, User | null>,
  ): Promise<User | null> {
    if (!location.userId) return null;
    return loader.load(location.userId);
  }

  @ResolveField('posts', () => [Post])
  async posts(
    @Parent() location: Location,
    @Loader(LocationPostsLoader) loader: DataLoader<string, Post[]>,
  ): Promise<Post[]> {
    return loader.load(location.id);
  }

  @ResolveField('events', () => [Event])
  async events(
    @Parent() location: Location,
    @Loader(LocationEventsLoader) loader: DataLoader<string, Event[]>,
  ): Promise<Event[]> {
    return loader.load(location.id);
  }
}
