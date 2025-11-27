import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from 'toastify-react-native';

import { LocationType } from '~/__generated__/graphql';
import { LocationCreateFormData } from '~/gql/helper.types';
import { PlaceDetailsResult, useReverseGeocode } from '~/hooks/GoogleMaps';
import { t } from '~/utils/i18n';

import { LocationAutocomplete } from './LocationAutocomplete';

interface LocationPickerProps {
  location: LocationCreateFormData | null;
  onLocationChange: (location: LocationCreateFormData | null) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ location, onLocationChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [tempLocation, setTempLocation] = useState<LocationCreateFormData | null>(location);
  const { reverseGeocode } = useReverseGeocode();

  // Selected place (if any) is represented by `location` prop via parent state

  const getLocationFromCoords = useCallback(
    async ([latitude, longitude]: [
      latitude: number,
      longitude: number,
    ]): Promise<LocationCreateFormData> => {
      const geocodeResult = await reverseGeocode(latitude, longitude);

      if (!geocodeResult) {
        throw new Error('No geocode data found');
      }

      return {
        coordinates: [longitude, latitude],
        street: geocodeResult.street,
        city: geocodeResult.city,
        country: geocodeResult.country,
        postalCode: geocodeResult.postalCode || undefined,
        type: LocationType.UserLocation,
      };
    },
    [reverseGeocode],
  );

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need location permission to detect your current location.',
        );
        return false;
      }

      return true;
    } catch (_error) {
      console.error('Error requesting location permission:', _error);
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      onLocationChange(
        await getLocationFromCoords([
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
        ]),
      );
    } catch (_error) {
      Toast.show({
        type: 'error',
        text1: t('postCreate.locationErrorTitle'),
        text2: t('postCreate.locationErrorMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [onLocationChange, requestLocationPermission, getLocationFromCoords]);

  const handleMapPress = useCallback(
    async (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;

      try {
        setTempLocation(await getLocationFromCoords([latitude, longitude]));
      } catch (_error) {
        console.error('Error geocoding location:', _error);
        setTempLocation(null);
      }
    },
    [getLocationFromCoords],
  );

  const confirmMapLocation = useCallback(() => {
    if (tempLocation) {
      onLocationChange(tempLocation);
      setShowMap(false);
    }
  }, [tempLocation, onLocationChange]);

  const removeLocation = useCallback(() => {
    onLocationChange(null);
  }, [onLocationChange]);

  const openMapPicker = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setTempLocation(location);
    setShowMap(true);
  }, [location, requestLocationPermission]);

  return (
    <View className="mb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-800">
          {t('postCreate.locationOptional')}
        </Text>
        {location && (
          <TouchableOpacity onPress={removeLocation}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Current Location Display */}
      {location && (
        <View className="mb-3 flex-row items-center gap-3 rounded-xl bg-blue-50 p-3">
          <Ionicons name="location" size={20} color="#3B82F6" />
          <View className="flex-1">
            <Text className="mb-0.5 text-[15px] font-semibold text-gray-800">
              {location.street || 'Location'}
            </Text>
            {location.street && (
              <Text className="text-[13px] text-gray-500">{location.street}</Text>
            )}
          </View>
        </View>
      )}
      {/* Autocomplete search (shown only if no location selected yet) */}
      {!location && (
        <LocationAutocomplete
          containerClassName="mb-3"
          onSelect={(details) => {
            const mapped = mapPlaceDetailsToFormData(details);
            onLocationChange(mapped);
          }}
        />
      )}

      {/* Action Buttons */}
      {!location && (
        <View className="mb-3 flex-row gap-2">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-blue-50 p-3"
            onPress={getCurrentLocation}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel={t('accessibility.locationButton')}
            accessibilityRole="button">
            {isLoading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#3B82F6" />
                <Text className="text-sm font-medium text-blue-500">
                  {t('postCreate.useCurrentLocation')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-blue-50 p-3"
            onPress={openMapPicker}
            accessible={true}
            accessibilityLabel="Select location on map"
            accessibilityRole="button">
            <Ionicons name="map" size={20} color="#3B82F6" />
            <Text className="text-sm font-medium text-blue-500">{t('postCreate.selectOnMap')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map Modal */}
      <Modal visible={showMap} animationType="slide" onRequestClose={() => setShowMap(false)}>
        <SafeAreaView className="flex-1 ">
          <View className="flex-1">
            <View
              className={`absolute inset-x-4 top-4 z-10 flex-row  items-center justify-between rounded-full border border-black/10 bg-white/60 p-4`}>
              <TouchableOpacity onPress={() => setShowMap(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-800">
                {t('postCreate.selectOnMap')}
              </Text>
              <TouchableOpacity onPress={confirmMapLocation}>
                <Ionicons name="checkmark" size={28} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              // initialRegion={location}
              zoomEnabled
              initialRegion={{
                latitude: tempLocation?.coordinates[1] || 52.52,
                longitude: tempLocation?.coordinates[0] || 13.405,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsMyLocationButton={false}
              followsUserLocation
              showsUserLocation
              onPress={handleMapPress}>
              {tempLocation && (
                <Marker
                  coordinate={{
                    latitude: tempLocation.coordinates[1],
                    longitude: tempLocation.coordinates[0],
                  }}
                  title={tempLocation.street}
                  description={getAddressString(tempLocation)}
                />
              )}
            </MapView>

            {tempLocation && (
              <View className="absolute bottom-5 left-5 right-5 rounded-xl bg-white p-4 shadow-lg">
                <Text className="text-sm text-gray-800">{getAddressString(tempLocation)}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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

function getAddressString(location?: LocationCreateFormData): string | undefined {
  if (!location) {
    return undefined;
  }

  return (
    [location.street, location.city, location.country].filter(Boolean).join(', ') +
    (location.postalCode ? ', ' + location.postalCode + '.' : '.')
  );
}

// Map Google Place Details to internal LocationCreateFormData
function mapPlaceDetailsToFormData(details: PlaceDetailsResult): LocationCreateFormData {
  const getComponent = (type: string) =>
    details.address_components.find((c) => c.types.includes(type))?.long_name || '';

  const streetNumber = getComponent('street_number');
  const route = getComponent('route');
  const street =
    (route ? `${route} ${streetNumber}`.trim() : details.name) ||
    details.formatted_address.split(',')[0];
  const city = getComponent('locality') || getComponent('administrative_area_level_2');
  const country = getComponent('country');
  const postalCode = getComponent('postal_code');

  return {
    coordinates: [details.longitude, details.latitude],
    street,
    city,
    country,
    postalCode: postalCode || undefined,
    type: LocationType.UserLocation,
  };
}
