import { useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { Toast } from 'toastify-react-native';

export interface UseCameraPermissionReturn {
  canAskAgain: boolean;
  clearError: () => void;
  error: string | null;
  hasPermission: boolean | null;
  loading: boolean;
  openAppSettings: () => Promise<void>;
  requestCameraPermission: () => Promise<void>;
}

export function useCameraPermission(): UseCameraPermissionReturn {
  const [status, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestCameraPermission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestPermission();

      if (result.status === 'granted') {
        // Permission granted
      } else {
        const errorMsg = 'Camera permission was denied';
        setError(errorMsg);
        Alert.alert('Permission Required', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request camera permission';
      setError(errorMsg);

      Toast.show({
        type: 'error',
        text1: 'Camera Permission Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  const openAppSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera permission in your app settings',
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
        'Camera Permission Required',
        'Please enable camera permission in your app settings',
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
    requestCameraPermission,
  };
}
