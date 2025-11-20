// React hook for fetching nearby places

import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { Region } from 'react-native-maps';
import { Toast } from 'toastify-react-native';

import { NEARBY_PLACES_QUERY } from '~/gql/google-maps';
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

type Options = {
  region?: Region;
  radius?: number;
  keywords: string[];
};

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
      } catch (err: any) {
        if (err?.message?.includes('The operation was aborted.')) {
          return [];
        }

        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Error fetching nearby places',
        });
        return [];
      }
    },
    [fetchNearby],
  );

  return { fetchNearbyPlacesByKeywords, data, loading, error };
}
