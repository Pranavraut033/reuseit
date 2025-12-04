import { useQuery } from '@apollo/client/react';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from 'toastify-react-native';

import { Button } from '~/components/common/Button';
import { FabButton } from '~/components/common/FabButton';
import ScreenContainer from '~/components/common/ScreenContainer';
import { TooltipWrapper } from '~/components/common/TooltipWrapper';
import { CategoryFilterBar, CategoryKey, RECYCLING_KEYWORDS } from '~/components/explore';
import { NEARBY_PLACES_QUERY } from '~/gql/google-maps';
import useStatusBarHeight from '~/hooks/useStatusBarHeight';
import { useUserLocation } from '~/hooks/useUserLocation';
import { t } from '~/utils/i18n';

// GraphQL type for nearby places
type NearbyPlace = {
  __typename?: 'NearbyPlace';
  placeId: string;
  name?: string | null;
  vicinity?: string | null;
  types?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
};
const INITIAL_REGION: Region = {
  // Berlin as default center
  latitude: 52.52,
  longitude: 13.405,
  latitudeDelta: 0.2,
  longitudeDelta: 0.5,
};
export default function ExplorePage() {
  const mapRef = useRef<MapView | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('general');

  const {
    location: userRegion,
    loading: isLoadingLocation,
    error: locationError,
    fetchUserLocation,
  } = useUserLocation();

  // Current visible region on the map
  const [currentVisibleRegion, setCurrentVisibleRegion] = useState<Region>(INITIAL_REGION);
  // Update last fetched region when region to fetch changes
  const [regionToFetch, setRegionToFetch] = useState<Region>(INITIAL_REGION);

  const keywords = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.values(RECYCLING_KEYWORDS).flat();
    }
    return RECYCLING_KEYWORDS[selectedCategory];
  }, [selectedCategory]);

  const {
    data,
    loading: isLoadingPlaces,
    error,
  } = useQuery(NEARBY_PLACES_QUERY, {
    variables: {
      latitude: regionToFetch.latitude,
      longitude: regionToFetch.longitude,
      radius: 1000,
      keywords,
    },
  });

  useEffect(() => {
    if (locationError || error) {
      Toast.show({
        type: 'error',
        text1: ' Error',
        text2: locationError || error?.message,
      });
    }
  }, [locationError, error]);

  const animateToCurrentLocation = useCallback(() => {
    if (!userRegion) return;

    if (userRegion && mapRef.current) {
      mapRef.current.animateToRegion(userRegion, 1000);
    }
  }, [userRegion]);

  useEffect(() => {
    animateToCurrentLocation();
  }, [animateToCurrentLocation]);

  const places = data?.nearbyPlaces || [];

  const insets = useSafeAreaInsets();

  const openInMaps = useCallback((selectedPlace: NearbyPlace) => {
    if (!selectedPlace?.latitude || !selectedPlace?.longitude) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Location not available',
      });
      return;
    }

    const lat = selectedPlace.latitude;
    const lng = selectedPlace.longitude;
    const name = selectedPlace.name || 'Destination';

    // Encode name so spaces/special chars work in URL
    const destination = encodeURIComponent(`${lat},${lng} (${name})`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Cannot open Google Maps.',
          });
        }
      })
      .catch((err) => console.error('An error occurred', err));
  }, []);
  useEffect(() => {
    setSelectedPlace(null);
  }, [places]);
  const showCurrentLocation = useMemo(() => {
    if (!userRegion) return true;

    const latDiff = Math.abs(currentVisibleRegion.latitude - userRegion.latitude);
    const lngDiff = Math.abs(currentVisibleRegion.longitude - userRegion.longitude);

    // Show button if user is more than ~0.01 degrees (~1km) away from center
    return latDiff > 0.01 || lngDiff > 0.01;
  }, [userRegion, currentVisibleRegion]);

  const showRefetchFab = useMemo(() => {
    const latDiff = Math.abs(currentVisibleRegion.latitude - regionToFetch.latitude);
    const lngDiff = Math.abs(currentVisibleRegion.longitude - regionToFetch.longitude);

    // Show refresh if user has moved more than ~0.005 degrees (~500m) from last fetched region
    return latDiff > 0.005 || lngDiff > 0.005;
  }, [currentVisibleRegion, regionToFetch]);

  return (
    <ScreenContainer safeArea={false} statusBarStyle="light-content">
      <View
        className="left-4 right-4 top-4 z-10 rounded p-6"
        style={[{ marginTop: useStatusBarHeight() }, styles.glassHeader]}>
        <Text className="text-center text-xl font-semibold text-primary-dark">
          {t('explore.title')}
        </Text>
        <Text className="mt-4 text-base text-slate-600">{t('explore.subtitle')}</Text>
      </View>
      <View className="absolute inset-x-0" style={{ zIndex: 10, top: insets.top + 130 }}>
        <CategoryFilterBar
          selected={selectedCategory}
          onSelect={(c) => {
            if (showRefetchFab) setRegionToFetch(currentVisibleRegion);

            setSelectedCategory(c as CategoryKey | 'all');
          }}
        />
      </View>
      {isLoadingPlaces && (
        <View
          className="absolute left-0 right-0 z-20 items-center"
          style={{ bottom: insets.bottom + 16 + 78 }}>
          <View className="rounded-full bg-white px-4 py-2 shadow-lg">
            <Text className="text-sm text-gray-700">{t('explore.loading')}</Text>
          </View>
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          initialRegion={INITIAL_REGION}
          zoomEnabled
          onRegionChangeComplete={setCurrentVisibleRegion}
          showsMyLocationButton={false}
          followsUserLocation
          showsUserLocation
          style={styles.map}>
          {/* Render fetched places as markers */}
          {places?.map((p) => {
            const lat = p.latitude;
            const lng = p.longitude;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            return (
              <Marker
                key={p.placeId}
                coordinate={{ latitude: lat, longitude: lng }}
                title={p.name || undefined}
                description={p.vicinity || undefined}
                onPress={() => {
                  setSelectedPlace(p);
                }}
              />
            );
          })}
        </MapView>
      </View>
      {/* Preview card for selected place */}
      <View className="pointer-events-box-none absolute bottom-[98px] left-4 right-4 items-end">
        {showCurrentLocation && (
          <TooltipWrapper content={t('explore.tooltipCurrentLocation')}>
            <FabButton
              icon={({ color, size }) => (
                <FontAwesome name="location-arrow" size={size} color={color} />
              )}
              loading={isLoadingLocation}
              className="bg-blue-500"
              iconColor="white"
              onPress={() => {
                if (userRegion) animateToCurrentLocation();
                else fetchUserLocation();
              }}
              size="small"
              type="neutral"
            />
          </TooltipWrapper>
        )}
        {showRefetchFab && (
          <TooltipWrapper content={t('explore.tooltipLoadArea')}>
            <FabButton
              icon={({ color, size }) => <MaterialIcons name="refresh" size={size} color={color} />}
              className="mt-2 bg-green-500"
              iconColor="white"
              onPress={() => setRegionToFetch(currentVisibleRegion)}
              size="small"
              type="neutral"
              disabled={isLoadingPlaces}
            />
          </TooltipWrapper>
        )}
        {selectedPlace && (
          <View className="mt-4 w-full overflow-hidden rounded-2xl">
            <LinearGradient
              colors={['#34A853', '#5cd67c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full  flex-row p-4 shadow-lg">
              <View className="mr-4 h-28 w-28 overflow-hidden rounded-xl border-2 border-white shadow-md">
                <PlacePhoto place={selectedPlace} />
              </View>
              <View className="flex-1 justify-center">
                <Text numberOfLines={2} className="text-lg font-bold text-white">
                  {selectedPlace.name}
                </Text>
                <Text numberOfLines={3} className="mt-1 text-sm text-white/80">
                  {selectedPlace.vicinity}
                </Text>

                <View className="mt-4 flex-row">
                  <Button
                    type="neutral"
                    size="small"
                    className="mr-4 rounded-full bg-white"
                    icon={({ size }) => (
                      <MaterialIcons name="directions" size={size} color="#34A853" />
                    )}
                    textClassName="text-primary"
                    onPress={() => {
                      openInMaps(selectedPlace);
                    }}>
                    {t('explore.directions')}
                  </Button>

                  <Button
                    size="small"
                    type="neutral"
                    className="rounded-full"
                    onPress={() => setSelectedPlace(null)}>
                    <Text className="text-sm font-semibold text-white">{t('explore.close')}</Text>
                  </Button>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const PlacePhoto: React.FC<{ place: NearbyPlace }> = ({ place }) => {
  // Use photoUrl from backend nearbyPlaces query
  const url = place.photoUrl;

  if (!url) {
    return (
      <View className="h-full w-full items-center justify-center bg-gray-400">
        <Text className="text-white">No Image</Text>
      </View>
    );
  }
  return (
    <Image source={{ uri: url }} className="h-full w-full" resizeMode="cover" onError={() => {}} />
  );
};

const styles = StyleSheet.create({
  glassHeader: {
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#0006',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 16,
    elevation: 3,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    overflow: 'hidden',
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
