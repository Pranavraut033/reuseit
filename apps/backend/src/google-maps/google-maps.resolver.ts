import { Args, Query, Resolver } from '@nestjs/graphql';

import { NearbyPlace } from './entities/nearby-place.entity';
import { PlaceAutocompletePrediction } from './entities/place-autocomplete-prediction.entity';
import { PlaceDetails } from './entities/place-details.entity';
import { ReverseGeocodeResult } from './entities/reverse-geocode-result.entity';
import { GoogleMapsService } from './google-maps.service';

@Resolver()
export class GoogleMapsResolver {
  constructor(private readonly googleMapsService: GoogleMapsService) {}

  @Query(() => [PlaceAutocompletePrediction], { name: 'placesAutocomplete' })
  placesAutocomplete(
    @Args('input', { type: () => String }) input: string,
    @Args('latitude', { type: () => Number, nullable: true }) latitude?: number,
    @Args('longitude', { type: () => Number, nullable: true }) longitude?: number,
    @Args('radius', { type: () => Number, nullable: true }) radius?: number,
    @Args('sessionToken', { type: () => String, nullable: true }) sessionToken?: string,
  ) {
    return this.googleMapsService.placesAutocomplete(
      input,
      latitude,
      longitude,
      radius,
      sessionToken,
    );
  }

  @Query(() => PlaceDetails, { name: 'placeDetails', nullable: true })
  placeDetails(
    @Args('placeId', { type: () => String }) placeId: string,
    @Args('sessionToken', { type: () => String, nullable: true }) sessionToken?: string,
  ) {
    return this.googleMapsService.placeDetails(placeId, sessionToken);
  }

  @Query(() => [NearbyPlace], { name: 'nearbyPlaces' })
  nearbyPlaces(
    @Args('latitude', { type: () => Number }) latitude: number,
    @Args('longitude', { type: () => Number }) longitude: number,
    @Args('radius', { type: () => Number, nullable: true }) radius: number = 500,
    @Args({ name: 'keywords', type: () => [String] }) keywords: string[],
  ) {
    return this.googleMapsService.nearbyPlaces(latitude, longitude, radius, keywords);
  }

  @Query(() => ReverseGeocodeResult, { name: 'reverseGeocode', nullable: true })
  reverseGeocode(
    @Args('latitude', { type: () => Number }) latitude: number,
    @Args('longitude', { type: () => Number }) longitude: number,
  ) {
    return this.googleMapsService.reverseGeocode(latitude, longitude);
  }

  @Query(() => String, { name: 'generatePlacesSessionToken' })
  generatePlacesSessionToken() {
    return this.googleMapsService.generateSessionToken();
  }
}
