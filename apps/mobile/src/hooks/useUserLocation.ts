import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Region } from 'react-native-maps';
import { Toast } from 'toastify-react-native';

import { useLocationPermission } from './useLocationPermission';

export interface UseUserLocationReturn {
  location: Region | undefined;
  loading: boolean;
  error: string | null;
  fetchUserLocation: () => Promise<void>;
  clearError: () => void;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<Region>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { requestPermission } = useLocationPermission();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUserLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permissions using the hook
      await requestPermission();

      // Check if permission was granted (the hook handles the alert if not)
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return; // Hook already showed alert
      }

      // Get current position with timeout handling
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location request timed out')), 15000),
      );

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationResult = await Promise.race([locationPromise, timeoutPromise]);

      setLocation({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        latitudeDelta: 0.2,
        longitudeDelta: 0.5,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMsg);

      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  return {
    location,
    loading,
    error,
    fetchUserLocation,
    clearError,
  };
}
