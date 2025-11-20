import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { Region } from 'react-native-maps';

import {
  GENERATE_PLACES_SESSION_TOKEN_QUERY,
  NEARBY_PLACES_QUERY,
  PLACE_DETAILS_QUERY,
  PLACES_AUTOCOMPLETE_QUERY,
  REVERSE_GEOCODE_QUERY,
} from '~/gql/google-maps';

// Legacy type for backward compatibility
export type Place = {
  place_id: string;
  name?: string;
  vicinity?: string;
  formatted_address?: string;
  types?: string[];
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
  photos?: {
    photo_reference?: string;
  }[];
  photoUrl?: string; // Added by backend
};

const getPlacePhotoUrl = (place: Place, _maxwidth = 400) => {
  // Since backend now returns photoUrl in nearbyPlaces, we can extract from there
  // For legacy support, try to build URL if photo_reference exists
  const photos = place?.photos || [];
  if (!photos.length) return null;
  const ref = photos[0]?.photo_reference;
  if (!ref) return null;
  // Note: Photo URLs are now served by backend in nearbyPlaces query
  // This function is kept for backward compatibility but may not work without API key on client
  console.warn('getPlacePhotoUrl called but photos are now served via backend nearbyPlaces');
  return null;
};

type Options = {
  region?: Region;
  radius?: number;
  keywords: string[];
};

// React hook for fetching nearby places
export function useNearbyPlaces() {
  const [fetchNearby, { data, loading, error }] = useLazyQuery(NEARBY_PLACES_QUERY);

  const fetchNearbyPlacesByKeywords = useCallback(
    async ({ region, radius = 500, keywords }: Options): Promise<Place[]> => {
      if (!region) {
        return [];
      }

      try {
        const result = await fetchNearby({
          variables: {
            latitude: region.latitude,
            longitude: region.longitude,
            radius,
            keywords,
          },
        });

        if (!result.data?.nearbyPlaces) return [];

        // Convert backend format to legacy Place format for compatibility
        return result.data.nearbyPlaces.map((p) => ({
          place_id: p.placeId,
          name: p.name ?? undefined,
          vicinity: p.vicinity ?? undefined,
          types: p.types ?? undefined,
          geometry: {
            location: {
              lat: p.latitude ?? 0,
              lng: p.longitude ?? 0,
            },
          },
          photos: p.photoUrl ? [{ photo_reference: p.photoUrl }] : [],
          photoUrl: p.photoUrl ?? undefined,
        }));
      } catch (err) {
        console.error('Error fetching nearby places:', err);
        return [];
      }
    },
    [fetchNearby],
  );

  return { fetchNearbyPlacesByKeywords, data, loading, error };
}

// Legacy wrapper for backward compatibility
const fetchNearbyPlacesByKeywords = async (_options: Options): Promise<Place[]> => {
  // This is a non-hook wrapper that should be replaced with useNearbyPlaces hook
  console.warn(
    'fetchNearbyPlacesByKeywords is deprecated. Use useNearbyPlaces hook in components.',
  );
  return [];
};

export type ReverseGeocodeResult = {
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
};

// React hook for reverse geocoding
export function useReverseGeocode() {
  const [fetchGeocode, { data, loading, error }] = useLazyQuery(REVERSE_GEOCODE_QUERY);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> => {
      try {
        const result = await fetchGeocode({
          variables: {
            latitude,
            longitude,
          },
        });

        if (!result.data?.reverseGeocode) {
          return null;
        }

        return {
          street: result.data.reverseGeocode.street || '',
          streetNumber: result.data.reverseGeocode.streetNumber || '',
          city: result.data.reverseGeocode.city || '',
          country: result.data.reverseGeocode.country || '',
          postalCode: result.data.reverseGeocode.postalCode || '',
          formattedAddress: result.data.reverseGeocode.formattedAddress || '',
        };
      } catch (err) {
        console.error('Error in reverse geocoding:', err);
        return null;
      }
    },
    [fetchGeocode],
  );

  return { reverseGeocode, data, loading, error };
}

// Legacy wrapper
const reverseGeocode = async (
  _latitude: number,
  _longitude: number,
): Promise<ReverseGeocodeResult | null> => {
  console.warn('reverseGeocode is deprecated. Use useReverseGeocode hook in components.');
  return null;
};

// -------------------- Places Autocomplete & Details --------------------

export type AutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: any;
  types?: string[];
};

export type PlacesAutocompleteOptions = {
  input: string;
  loc?: Region; // bias results near location
  radius?: number; // meters, only used with loc
  sessionToken?: string; // recommended for billing grouping
};

export type PlaceDetailsResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
};

// React hook for generating session tokens
export function useGenerateSessionToken() {
  const [fetchToken, { data, loading, error }] = useLazyQuery(GENERATE_PLACES_SESSION_TOKEN_QUERY);

  const generateSessionToken = useCallback(async (): Promise<string> => {
    try {
      const result = await fetchToken();
      return result.data?.generatePlacesSessionToken || Math.random().toString(36).slice(2);
    } catch (err) {
      console.error('Error generating session token:', err);
      return Math.random().toString(36).slice(2);
    }
  }, [fetchToken]);

  return { generateSessionToken, data, loading, error };
}

// Legacy wrapper
const generateSessionToken = async (): Promise<string> => {
  console.warn(
    'generateSessionToken is deprecated. Use useGenerateSessionToken hook in components.',
  );
  return Math.random().toString(36).slice(2);
};

// React hook for places autocomplete
export function usePlacesAutocomplete() {
  const [fetchAutocomplete, { data, loading, error }] = useLazyQuery(PLACES_AUTOCOMPLETE_QUERY);

  const placesAutocomplete = useCallback(
    async ({
      input,
      loc,
      radius = 5000,
      sessionToken,
    }: PlacesAutocompleteOptions): Promise<AutocompletePrediction[]> => {
      if (!input.trim()) return [];

      try {
        const result = await fetchAutocomplete({
          variables: {
            input,
            latitude: loc?.latitude,
            longitude: loc?.longitude,
            radius,
            sessionToken,
          },
        });

        if (!result.data?.placesAutocomplete) return [];

        return result.data.placesAutocomplete.map((p) => ({
          description: p.description,
          place_id: p.placeId,
          types: p.types || [],
        }));
      } catch (err) {
        console.error('placesAutocomplete error:', err);
        return [];
      }
    },
    [fetchAutocomplete],
  );

  return { placesAutocomplete, data, loading, error };
}

// Legacy wrapper
const placesAutocomplete = async (
  _options: PlacesAutocompleteOptions,
): Promise<AutocompletePrediction[]> => {
  console.warn('placesAutocomplete is deprecated. Use usePlacesAutocomplete hook in components.');
  return [];
};

// React hook for fetching place details
export function usePlaceDetails() {
  const [fetchDetails, { data, loading, error }] = useLazyQuery(PLACE_DETAILS_QUERY);

  const fetchPlaceDetails = useCallback(
    async (placeId: string, sessionToken?: string): Promise<PlaceDetailsResult | null> => {
      if (!placeId) return null;

      try {
        const result = await fetchDetails({
          variables: {
            placeId,
            sessionToken,
          },
        });

        if (!result.data?.placeDetails) return null;

        const details = result.data.placeDetails;
        return {
          place_id: details.placeId,
          name: details.name,
          formatted_address: details.formattedAddress,
          latitude: details.latitude,
          longitude: details.longitude,
          address_components: (details.addressComponents || []).map((c) => ({
            long_name: c.longName,
            short_name: c.shortName,
            types: c.types,
          })),
        };
      } catch (err) {
        console.error('fetchPlaceDetails error:', err);
        return null;
      }
    },
    [fetchDetails],
  );

  return { fetchPlaceDetails, data, loading, error };
}

// Legacy wrapper
const fetchPlaceDetails = async (
  _placeId: string,
  _sessionToken?: string,
): Promise<PlaceDetailsResult | null> => {
  console.warn('fetchPlaceDetails is deprecated. Use usePlaceDetails hook in components.');
  return null;
};

export {
  fetchNearbyPlacesByKeywords,
  fetchPlaceDetails,
  generateSessionToken,
  getPlacePhotoUrl,
  placesAutocomplete,
  reverseGeocode,
};
