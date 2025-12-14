import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Region } from 'react-native-maps';
import { Toast } from 'toastify-react-native';

import { useStore } from '~/store';

import { useLocationPermission } from './useLocationPermission';

export interface UseUserLocationReturn {
  location: Region | null;
  loading: boolean;
  error: string | null;
  fetchUserLocation: (silent?: boolean) => Promise<void>;
  clearError: () => void;
}

export function useUserLocation(): UseUserLocationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { location, setLocation } = useStore();

  const { requestPermission } = useLocationPermission();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUserLocation = useCallback(
    async (silent = false) => {
      setLoading(true);
      setError(null);

      try {
        // Request permissions using the hook
        if (!silent) await requestPermission();

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

        const region: Region = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.5,
        };

        setLocation(region);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get location';
        setError(errorMsg);

        if (!silent)
          Toast.show({
            type: 'error',
            text1: 'Location Error',
            text2: errorMsg,
          });
      } finally {
        setLoading(false);
      }
    },
    [requestPermission, setLocation],
  );

  return {
    location,
    loading,
    error,
    fetchUserLocation,
    clearError,
  };
}
