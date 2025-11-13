import { Container } from '~/src/components/common/Container';
import { Text, View, StyleSheet, Linking, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Region,
  Marker,
} from 'react-native-maps';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { FabButton } from '~/src/components/common/FabButton';
import { TooltipWrapper } from '~/src/components/common/TooltipWrapper';
import useStatusBarHeight from '~/src/hooks/useStatusBarHeight';
import { MotiView } from 'moti';

export default function Home() {
  const [location, setLocation] = useState<Region>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [places, setPlaces] = useState<Array<any>>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const regionChangedRef = useRef(false); // Add this ref

  const getCurrentLocation = useCallback(async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.2,
      longitudeDelta: 0.5,
    });
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Helper to read API key from Expo config or env
  const getGoogleApiKey = () => {
    try {
      // prefer expo config values when available
      // these keys are defined in app.config.js under ios.config.googleMapsApiKey and android.config.googleMaps.apiKey
      const expoConfig = (Constants as any).expoConfig || (Constants as any).manifest || {};
      return (
        expoConfig?.ios?.config?.googleMapsApiKey ||
        expoConfig?.android?.config?.googleMaps?.apiKey ||
        process.env.GOOGLE_MAPS_API_KEY ||
        ''
      );
    } catch (e) {
      return '';
    }
  };

  const getPlacePhotoUrl = (place: any, maxwidth = 400) => {
    try {
      const photos = place?.photos || [];
      if (!photos.length) return null;
      const ref = photos[0]?.photo_reference;
      if (!ref) return null;
      const key = getGoogleApiKey();
      if (!key) return null;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${encodeURIComponent(
        ref,
      )}&key=${key}`;
    } catch (e) {
      return null;
    }
  };

  // Fetch nearby places for recycling and clothing donation using Google Places Nearby Search
  const fetchNearbyRecyclingAndDonationPlaces = useCallback(
    async (loc?: Region) => {
      if (!loc) return;
      const apiKey = getGoogleApiKey();
      if (!apiKey) {
        console.warn('Google Maps API key not found. Set GOOGLE_MAPS_API_KEY in app config or env.');
        return;
      }

      setLoadingPlaces(true);
      try {
        const locationStr = `${loc.latitude},${loc.longitude}`;
        const radius = 5000; // meters

        // We'll query twice with different keywords and combine unique results
        const keywords = [
          'recycling',
          'recycling center',
          'clothing donation',
          'clothing drop-off',
          'donation center',
        ];

        const allResults: Record<string, any> = {};

        for (const kw of keywords) {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${encodeURIComponent(
            locationStr,
          )}&radius=${radius}&keyword=${encodeURIComponent(kw)}&key=${apiKey}`;

          const res = await fetch(url);
          if (!res.ok) continue;
          const json = await res.json();
          const results = json.results || [];
          for (const r of results) {
            if (r.place_id && !allResults[r.place_id]) {
              allResults[r.place_id] = r;
            }
          }

          // if the API returns a next_page_token we could handle pagination here
          // but for simplicity we'll ignore paginated results in this first iteration
        }

        setPlaces(Object.values(allResults));
      } catch (e) {
        console.warn('Error fetching places', e);
      } finally {
        setLoadingPlaces(false);
      }
    },
    [],
  );

  const animateToCurrentLocation = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(location, 1000);
      setShowCurrentLocation(false);
      setTimeout(() => {
        regionChangedRef.current = false; // Reset the ref after animation
      }, 1500); // Reset after the animation duration
    }
  }, [location]);

  useEffect(() => {
    animateToCurrentLocation();
  }, [animateToCurrentLocation]);

  // Fetch places whenever we get a location
  useEffect(() => {
    if (location) {
      fetchNearbyRecyclingAndDonationPlaces(location);
    }
  }, [location, fetchNearbyRecyclingAndDonationPlaces]);

  return (
    <Container noPadding >
      <View
        className="left-4 right-4 top-4 z-10 rounded p-6"
        style={[{ marginTop: useStatusBarHeight() }, styles.glassHeader]}>
        <Text className="text-center text-xl font-semibold text-primary-dark">Explore Events</Text>
        <Text className="mt-4 text-base text-slate-600">
          Discover local events, workshops, and community activities happening near you.
        </Text>
      </View>
      {showCurrentLocation && (
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute bottom-[98px] right-5 z-30"
          transition={{ type: 'timing', duration: 300 }}
          style={{
            overflow: 'hidden',
            borderRadius: 0, // fix for fab button not showing properly
          }}>
          <TooltipWrapper content="Go to Current Location">
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
        </MotiView>
      )}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          initialRegion={location}
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
          {places.map((p) => {
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
      {selectedPlace && (
        <View className="absolute bottom-[104px] left-4 right-4 items-center" pointerEvents="box-none">
          <View className="flex-row bg-white rounded-xl p-3 w-full shadow-lg">
            <View className="w-24 h-24 rounded-lg overflow-hidden mr-3">
              {(() => {
                const url = getPlacePhotoUrl(selectedPlace);
                if (!url) {
                  return (
                    <View className="w-full h-full bg-gray-400 justify-center items-center">
                      <Text className="text-white">No Image</Text>
                    </View>
                  );
                }
                return (
                  <Image
                    source={{ uri: url }}
                    className="w-full h-full"
                    resizeMode="cover"
                    onError={() => { }}
                  />
                );
              })()}
            </View>
            <View className="flex-1 justify-center">
              <Text numberOfLines={1} className="text-base font-semibold">{selectedPlace.name}</Text>
              <Text numberOfLines={2} className="text-sm text-gray-500 mt-1">{selectedPlace.vicinity || selectedPlace.formatted_address}</Text>
              <View className="flex-row space-x-2 mt-2">
                <TouchableOpacity
                  className="px-3 py-2 bg-blue-600 rounded-md items-center justify-center"
                  onPress={() => {
                    // open directions in maps
                    const lat = selectedPlace.geometry?.location?.lat;
                    const lng = selectedPlace.geometry?.location?.lng;
                    if (lat && lng) {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                      Linking.openURL(url);
                    }
                  }}
                >
                  <Text className="text-white">Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-3 py-2 bg-gray-200 rounded-md items-center justify-center"
                  onPress={() => setSelectedPlace(null)}
                >
                  <Text className="text-black">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </Container>
  );
}

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
