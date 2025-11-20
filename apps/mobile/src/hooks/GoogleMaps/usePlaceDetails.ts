import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';

import { PLACE_DETAILS_QUERY } from '~/gql/google-maps';

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
