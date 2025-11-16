import { useQuery } from '@tanstack/react-query';

import { fetchNearbyPlacesByKeywords, getPlacePhotoUrl } from '~/utils/googleMaps';

function useFetchNearbyPlacesByKeywords(
  ...[{ loc, radius, keywords }]: Parameters<typeof fetchNearbyPlacesByKeywords>
) {
  return useQuery({
    queryKey: ['nearbyPlaces', loc, keywords, radius],
    queryFn: () => fetchNearbyPlacesByKeywords({ loc, keywords, radius }),
    enabled: !!loc,
  });
}

function useGetPlacePhotoUrl(...[place, maxwidth]: Parameters<typeof getPlacePhotoUrl>) {
  const { data, error } = useQuery({
    queryKey: ['placePhotoUrl', place.place_id, maxwidth],
    queryFn: () => getPlacePhotoUrl(place, maxwidth),
  });

  if (error) {
    console.warn('Error fetching place photo URL', { error });
  }

  return data;
}

export { useFetchNearbyPlacesByKeywords, useGetPlacePhotoUrl };
