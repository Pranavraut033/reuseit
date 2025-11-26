import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
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
import { Place } from '~/hooks/GoogleMaps';
import { useFetchNearbyPlacesByKeywords } from '~/hooks/GoogleMaps/useFetchNearbyPlacesByKeywords';
import useStatusBarHeight from '~/hooks/useStatusBarHeight';
import { t } from '~/utils/i18n';

export default function ExplorePage() {
  const [region, setRegion] = useState<Region>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const regionChangedRef = useRef(false); // Add this ref
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('general');

  const getCurrentLocation = useCallback(async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.2,
      longitudeDelta: 0.5,
    });
  }, []);
  useEffect(() => {
    if (errorMsg) {
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: errorMsg,
      });
    }
  }, [errorMsg]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const animateToCurrentLocation = useCallback(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
      setShowCurrentLocation(false);
      setTimeout(() => {
        regionChangedRef.current = false; // Reset the ref after animation
      }, 1500); // Reset after the animation duration
    }
  }, [region]);

  useEffect(() => {
    animateToCurrentLocation();
  }, [animateToCurrentLocation]);

  const keywords = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.values(RECYCLING_KEYWORDS).flat();
    }
    return RECYCLING_KEYWORDS[selectedCategory];
  }, [selectedCategory]);

  const { data: places, isLoading: isLoadingPlaces } = useFetchNearbyPlacesByKeywords({
    region,
    radius: 500,
    keywords,
  });

  const insets = useSafeAreaInsets();

  const openInMaps = useCallback((selectedPlace: Place) => {
    if (!selectedPlace?.geometry?.location) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Location not available',
      });
      return;
    }

    const { lat, lng } = selectedPlace.geometry.location;
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
            setSelectedCategory(c as CategoryKey | 'all');
            setSelectedPlace(null); // clear selection when category changes
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
          initialRegion={region}
          zoomEnabled
          onRegionChange={() => {
            if (!regionChangedRef.current) {
              setShowCurrentLocation(true);
              regionChangedRef.current = true;
            }
          }}
          showsMyLocationButton={false}
          followsUserLocation
          showsUserLocation
          style={styles.map}>
          {/* Render fetched places as markers */}
          {places?.map((p) => {
            const lat = p.geometry?.location?.lat;
            const lng = p.geometry?.location?.lng;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            return (
              <Marker
                key={p.place_id}
                coordinate={{ latitude: lat, longitude: lng }}
                title={p.name}
                description={p.vicinity || p.formatted_address}
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
              className="bg-blue-500"
              iconColor="white"
              onPress={animateToCurrentLocation}
              size="small"
              type="neutral"
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
                  {selectedPlace.vicinity || selectedPlace.formatted_address}
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

const PlacePhoto: React.FC<{ place: Place }> = ({ place }) => {
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
