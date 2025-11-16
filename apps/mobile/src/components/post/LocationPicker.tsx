import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect,useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { t } from '~/utils/i18n';

export interface LocationData {
  name?: string;
  address?: string;
  coordinates: [number, number]; // [longitude, latitude]
  googlePlaceId?: string;
}

interface LocationPickerProps {
  location: LocationData | null;
  onLocationChange: (location: LocationData | null) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [tempLocation, setTempLocation] = useState<LocationData | null>(location);
  const [manualAddress, setManualAddress] = useState('');

  useEffect(() => {
    if (location?.address) {
      setManualAddress(location.address);
    }
  }, [location]);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need location permission to detect your current location.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const locationData: LocationData = {
        coordinates: [currentLocation.coords.longitude, currentLocation.coords.latitude],
        address: geocode
          ? `${geocode.street || ''} ${geocode.streetNumber || ''}, ${geocode.city || ''}, ${geocode.postalCode || ''}`.trim()
          : undefined,
        name: geocode?.city || geocode?.district || 'Current Location',
      };

      onLocationChange(locationData);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    try {
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const locationData: LocationData = {
        coordinates: [longitude, latitude],
        address: geocode
          ? `${geocode.street || ''} ${geocode.streetNumber || ''}, ${geocode.city || ''}, ${geocode.postalCode || ''}`.trim()
          : undefined,
        name: geocode?.city || geocode?.district || 'Selected Location',
      };

      setTempLocation(locationData);
    } catch (error) {
      console.error('Error geocoding location:', error);
      setTempLocation({
        coordinates: [longitude, latitude],
        address: undefined,
        name: 'Selected Location',
      });
    }
  };

  const confirmMapLocation = () => {
    if (tempLocation) {
      onLocationChange(tempLocation);
      setShowMap(false);
    }
  };

  const handleManualEntry = () => {
    if (manualAddress.trim()) {
      const locationData: LocationData = {
        coordinates: location?.coordinates || [13.4050, 52.5200], // Default to Berlin center
        address: manualAddress.trim(),
        name: 'Manual Entry',
      };
      onLocationChange(locationData);
    }
  };

  const removeLocation = () => {
    onLocationChange(null);
    setManualAddress('');
  };

  const openMapPicker = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setTempLocation(location);
    setShowMap(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('postCreate.locationOptional')}</Text>
        {location && (
          <TouchableOpacity onPress={removeLocation}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Current Location Display */}
      {location && (
        <View style={styles.locationDisplay}>
          <Ionicons name="location" size={20} color="#3B82F6" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name || 'Location'}</Text>
            {location.address && (
              <Text style={styles.locationAddress}>{location.address}</Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!location && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={getCurrentLocation}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel={t('accessibility.locationButton')}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#3B82F6" />
                <Text style={styles.actionButtonText}>
                  {t('postCreate.useCurrentLocation')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={openMapPicker}
            accessible={true}
            accessibilityLabel="Select location on map"
            accessibilityRole="button"
          >
            <Ionicons name="map" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>{t('postCreate.selectOnMap')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual Entry */}
      <View style={styles.manualEntry}>
        <TextInput
          style={styles.manualInput}
          placeholder={t('postCreate.enterManually')}
          value={manualAddress}
          onChangeText={setManualAddress}
          onBlur={handleManualEntry}
          editable={!isLoading}
        />
      </View>

      {/* Map Modal */}
      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>{t('postCreate.selectOnMap')}</Text>
            <TouchableOpacity onPress={confirmMapLocation}>
              <Ionicons name="checkmark" size={28} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: tempLocation?.coordinates[1] || 52.5200,
              longitude: tempLocation?.coordinates[0] || 13.4050,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            {tempLocation && (
              <Marker
                coordinate={{
                  latitude: tempLocation.coordinates[1],
                  longitude: tempLocation.coordinates[0],
                }}
                title={tempLocation.name}
                description={tempLocation.address}
              />
            )}
          </MapView>

          {tempLocation && (
            <View style={styles.mapInfoCard}>
              <Text style={styles.mapInfoText}>{tempLocation.address || 'Tap on the map to select a location'}</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Education Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.tipText}>
          Adding location helps others find items nearby
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  manualEntry: {
    marginBottom: 12,
  },
  manualInput: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
  },
  mapContainer: {
    flex: 1,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  map: {
    flex: 1,
  },
  mapInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapInfoText: {
    fontSize: 14,
    color: '#1F2937',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
});
