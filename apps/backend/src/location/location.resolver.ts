import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { Cache } from 'cache-manager';
import DataLoader from 'dataloader';
import { Loader } from 'nestjs-dataloader';

import { CacheQuery, InvalidateCache } from '~/decorators/cache.decorator';
import { CurrentUser } from '~/decorators/CurrentUser';
import { Post } from '~/post/entities/post.entity';
import { User } from '~/user/entities/user.entity';
import { UserLoader } from '~/user/user.loader';

import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { Location } from './entities/location.entity';
import { LocationEventsLoader, LocationPostsLoader } from './location.loader';
import { LocationService } from './location.service';

@Resolver(() => Location)
export class LocationResolver {
  constructor(
    private readonly locationService: LocationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Query(() => [Location], { name: 'locations' })
  @CacheQuery(() => 'locations', 600)
  findAll() {
    return this.locationService.findAll();
  }

  @Query(() => Location, { name: 'location' })
  @CacheQuery(
    (latitude: number, longitude: number, radiusInKm?: number) =>
      `locationNearby:${latitude}:${longitude}:${radiusInKm || 10}`,
    300,
  )
  findNearby(
    @Args('latitude', { type: () => Number }) latitude: number,
    @Args('longitude', { type: () => Number }) longitude: number,
    @Args('radiusInKm', { type: () => Number, nullable: true }) radiusInKm?: number,
  ) {
    // Implementation for finding nearby locations can be added here
    return this.locationService.findNearBy(latitude, longitude, radiusInKm); // Placeholder implementation
  }

  @Query(() => Location, { name: 'location' })
  @CacheQuery((id: string) => `location:${id}`, 600)
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.locationService.findOne(id);
  }

  @Mutation(() => Location)
  @InvalidateCache((result: Location) => [`locations`, `location:${result.id}`])
  createLocation(
    @Args('createLocationInput') createLocationInput: CreateLocationInput,
    @CurrentUser() user?: User,
  ) {
    return this.locationService.create(createLocationInput, user?.id);
  }

  @Mutation(() => Location)
  @InvalidateCache((result: Location) => [`locations`, `location:${result.id}`])
  updateLocation(@Args('updateLocationInput') updateLocationInput: UpdateLocationInput) {
    return this.locationService.update(updateLocationInput);
  }

  @Mutation(() => Location)
  @InvalidateCache((_result: Location, id: string) => [`locations`, `location:${id}`])
  removeLocation(@Args('id', { type: () => String }) id: string) {
    return this.locationService.remove(id);
  }

  // Field resolvers for relations
  @ResolveField('createdBy', () => User, { nullable: true })
  async createdBy(
    @Parent() location: Location & { userId?: string | null },
    @Loader(UserLoader) loader: DataLoader<string, User | null>,
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
