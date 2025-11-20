import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';

import { REVERSE_GEOCODE_QUERY } from '~/gql/google-maps';

export type ReverseGeocodeResult = {
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
};

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
