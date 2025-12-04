import {
  type AddressType,
  Client,
  type GeocodingAddressComponentType,
} from '@googlemaps/google-maps-services-js';
import { Injectable, Logger } from '@nestjs/common';

import { NearbyPlace } from './entities/nearby-place.entity';
import { PlaceAutocompletePrediction } from './entities/place-autocomplete-prediction.entity';
import { AddressComponent, PlaceDetails } from './entities/place-details.entity';
import { ReverseGeocodeResult } from './entities/reverse-geocode-result.entity';

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private apiKey: string | undefined;
  private client: Client;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set for backend GoogleMapsService');
    }
    this.client = new Client({});
  }

  private hasKey(): boolean {
    return !!this.apiKey;
  }

  generateSessionToken(): string {
    return Math.random().toString(36).slice(2);
  }

  async placesAutocomplete(
    input: string,
    latitude?: number,
    longitude?: number,
    radius: number = 5000,
    sessionToken?: string,
  ): Promise<PlaceAutocompletePrediction[]> {
    if (!this.hasKey() || !input.trim()) return [];
    try {
      const response = await this.client.placeAutocomplete({
        params: {
          input,
          key: this.apiKey!,
          sessiontoken: sessionToken,
          ...(latitude !== undefined && longitude !== undefined
            ? {
                location: { lat: latitude, lng: longitude },
                radius,
              }
            : {}),
        },
      });

      const preds: PlaceAutocompletePrediction[] = (response.data.predictions || []).map(
        (p): PlaceAutocompletePrediction => ({
          description: p.description,
          placeId: p.place_id,
          types: p.types || [],
        }),
      );
      return preds;
    } catch (e) {
      this.logger.warn('placesAutocomplete error', e);
      return [];
    }
  }

  async placeDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails | null> {
    if (!this.hasKey() || !placeId) return null;

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey!,
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_component'],
          sessiontoken: sessionToken,
        },
      });

      const r = response.data.result;
      if (!r) return null;

      const latitude = r.geometry?.location?.lat;
      const longitude = r.geometry?.location?.lng;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

      const details: PlaceDetails = {
        placeId: r.place_id || placeId,
        name: r.name || '',
        formattedAddress: r.formatted_address || '',
        latitude,
        longitude,
        addressComponents: (r.address_components || []).map(
          (c): AddressComponent => ({
            longName: c.long_name,
            shortName: c.short_name,
            types: c.types || [],
          }),
        ),
      };
      return details;
    } catch (e) {
      this.logger.warn('placeDetails error', e);
      return null;
    }
  }

  async nearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 500,
    keywords: string[],
  ): Promise<NearbyPlace[]> {
    if (!this.hasKey()) return [];
    const unique: Record<string, NearbyPlace> = {};

    for (const kw of keywords) {
      try {
        const response = await this.client.placesNearby({
          params: {
            location: { lat: latitude, lng: longitude },
            radius,
            keyword: kw,
            key: this.apiKey!,
          },
        });

        const results = response.data.results || [];
        const places: NearbyPlace[] = [];

        for (const r of results) {
          if (r.place_id && !unique[r.place_id]) {
            const lat = r.geometry?.location?.lat;
            const lng = r.geometry?.location?.lng;
            let photoUrl: string | undefined;
            const ref = r.photos?.[0]?.photo_reference;
            if (ref && this.apiKey) {
              photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${encodeURIComponent(
                ref,
              )}&key=${this.apiKey}`;
            }
            const place: NearbyPlace = {
              placeId: r.place_id,
              name: r.name || '',
              vicinity: r.vicinity || '',
              types: r.types || [],
              latitude: typeof lat === 'number' ? lat : undefined,
              longitude: typeof lng === 'number' ? lng : undefined,
              photoUrl,
            };
            unique[r.place_id] = place;
            places.push(place);
          }
        }
      } catch (e) {
        this.logger.warn('nearbyPlaces error', e);
        continue;
      }
    }
    return Object.values(unique);
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    if (!this.hasKey()) return null;

    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          key: this.apiKey!,
        },
      });

      const result = response.data.results?.[0];
      if (!result) return null;

      const comps = result.address_components || [];
      const getComp = (type: string) =>
        comps.find((c) => c.types?.includes(type as AddressType | GeocodingAddressComponentType))
          ?.long_name || '';

      const streetNumber = getComp('street_number');
      const route = getComp('route');
      const street =
        `${route} ${streetNumber}`.trim() || result.formatted_address?.split(',')[0] || '';
      const city = getComp('locality') || getComp('administrative_area_level_2');
      const country = getComp('country');
      const postalCode = getComp('postal_code');

      const value: ReverseGeocodeResult = {
        street,
        streetNumber,
        city,
        country,
        postalCode,
        formattedAddress: result.formatted_address || '',
      };
      return value;
    } catch (e) {
      this.logger.error('reverseGeocode error', e);
      return null;
    }
  }
}
