import { useQuery } from '@tanstack/react-query';

import { useNearbyPlaces } from './useNearbyPlaces';

function useFetchNearbyPlacesByKeywords(
  ...[{ region, radius, keywords }]: Parameters<
    ReturnType<typeof useNearbyPlaces>['fetchNearbyPlacesByKeywords']
  >
) {
  const { fetchNearbyPlacesByKeywords } = useNearbyPlaces();

  return useQuery({
    queryKey: ['nearbyPlaces', region, keywords, radius],
    queryFn: () => fetchNearbyPlacesByKeywords({ region, keywords, radius }),
    enabled: !!region,
  });
}

export { useFetchNearbyPlacesByKeywords };
