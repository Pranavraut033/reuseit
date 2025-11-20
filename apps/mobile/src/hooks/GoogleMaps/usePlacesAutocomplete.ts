import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { Region } from 'react-native-maps/lib/sharedTypes';

import { PLACES_AUTOCOMPLETE_QUERY } from '~/gql/google-maps';

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
