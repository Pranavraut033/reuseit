import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { MotiView } from 'moti';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Toast } from 'toastify-react-native';

import { Button } from '~/components/common/Button';
import { FabButton } from '~/components/common/FabButton';
import { TooltipWrapper } from '~/components/common/TooltipWrapper';
import { useFetchNearbyPlacesByKeywords, useGetPlacePhotoUrl } from '~/hooks/googlemaps';
import useStatusBarHeight from '~/hooks/useStatusBarHeight';
import { Place } from '~/utils/googleMaps';

export default function Home() {
  const [location, setLocation] = useState<Region>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
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

  const { data: places, isLoading: isLoadingPlaces } = useFetchNearbyPlacesByKeywords({
    loc: location!,
    keywords: ['event', 'workshop', 'community activity'],
    radius: 5000,
  });

  return (
    <View className="flex-1">
      <View
        className="left-4 right-4 top-4 z-10 rounded p-6"
        style={[{ marginTop: useStatusBarHeight() }, styles.glassHeader]}
      >
        <Text className="text-center text-xl font-semibold text-primary-dark">Explore Nearby</Text>
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
          }}
        >
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
          style={styles.map}
        >
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
      {selectedPlace && (
        <View
          className="absolute bottom-[104px] left-4 right-4 items-center"
          pointerEvents="box-none"
        >
          <View className="flex-row bg-white rounded-xl p-3 w-full shadow-lg">
            <View className="w-24 h-24 rounded-lg overflow-hidden mr-3">
              <PlacePhoto place={selectedPlace} />
            </View>
            <View className="flex-1 justify-center">
              <Text numberOfLines={2} className="text-base font-semibold">
                {selectedPlace.name}
              </Text>
              <Text numberOfLines={3} className="text-sm text-gray-500 mt-1">
                {selectedPlace.vicinity || selectedPlace.formatted_address}
              </Text>
              <View className="flex-row mt-2">
                <Button
                  size="small"
                  className="mr-3"
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
                  Directions
                </Button>
                <Button size="small" type="neutral" onPress={() => setSelectedPlace(null)}>
                  Close
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const PlacePhoto: React.FC<{ place: Place }> = ({ place }) => {
  const url = useGetPlacePhotoUrl(place, 400);

  if (!url) {
    return (
      <View className="w-full h-full bg-gray-400 justify-center items-center">
        <Text className="text-white">No Image</Text>
      </View>
    );
  }
  return (
    <Image source={{ uri: url }} className="w-full h-full" resizeMode="cover" onError={() => {}} />
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
