import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { Toast } from 'toastify-react-native';

import { UsePermissionReturn } from '~/types/permissions';

export function useLocationPermission(): UsePermissionReturn {
  const [status, rp] = Location.useForegroundPermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await rp();

      if (result?.status === 'granted') {
        // Permission granted
      } else {
        const errorMsg = 'Location permission was denied';
        setError(errorMsg);
        Alert.alert('Permission Required', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request location permission';
      setError(errorMsg);

      Toast.show({
        type: 'error',
        text1: 'Location Permission Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [rp]);

  const openAppSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permission in your app settings',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              await Linking.openURL('app-settings:').catch((error) => {
                console.error('Failed to open app settings:', error);
              });
            },
          },
        ],
      );
    } else {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permission in your app settings',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              await Linking.openSettings().catch((error) => {
                console.error('Failed to open app settings:', error);
              });
            },
          },
        ],
      );
    }
  }, []);

  return {
    canAskAgain: status?.canAskAgain ?? true,
    clearError,
    error,
    hasPermission: status?.granted ?? null,
    loading,
    openAppSettings,
    requestPermission,
  };
}
