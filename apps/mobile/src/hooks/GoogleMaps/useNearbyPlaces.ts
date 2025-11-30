// React hook for fetching nearby places

import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { Region } from 'react-native-maps';
import { Toast } from 'toastify-react-native';

import { NEARBY_PLACES_QUERY, Place } from '~/gql/google-maps';

type Options = {
  region?: Region;
  radius?: number;
  keywords: string[];
};

export function useNearbyPlaces() {
  const [fetchNearby, props] = useLazyQuery(NEARBY_PLACES_QUERY);

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
        return result.data.nearbyPlaces;
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

  return { fetchNearbyPlacesByKeywords, ...props };
}
