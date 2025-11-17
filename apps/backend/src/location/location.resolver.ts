import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { Location } from './entities/location.entity';
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
  createLocation(@Args('createLocationInput') createLocationInput: CreateLocationInput) {
    return this.locationService.create(createLocationInput);
  }

  @Mutation(() => Location)
  updateLocation(@Args('updateLocationInput') updateLocationInput: UpdateLocationInput) {
    return this.locationService.update(updateLocationInput);
  }

  @Mutation(() => Location)
  removeLocation(@Args('id', { type: () => String }) id: string) {
    return this.locationService.remove(id);
  }
}
