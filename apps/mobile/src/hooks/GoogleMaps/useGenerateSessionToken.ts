import { useLazyQuery } from '@apollo/client/react';
import { useCallback } from 'react';

import { GENERATE_PLACES_SESSION_TOKEN_QUERY } from '~/gql/google-maps';

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
