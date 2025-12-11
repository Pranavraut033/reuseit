import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { Toast } from 'toastify-react-native';

import { UsePermissionReturn } from '~/types/permissions';

export function useNotificationPermission(): UsePermissionReturn {
  const [status, setStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const { status: currentStatus, canAskAgain: askAgain } =
        await Notifications.getPermissionsAsync();
      setStatus(currentStatus);
      setCanAskAgain(askAgain);
    } catch (err) {
      console.error('Failed to check notification permission:', err);
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await Notifications.requestPermissionsAsync();

      setStatus(result.status);
      setCanAskAgain(result.canAskAgain);

      if (result.status === 'granted') {
        // Permission granted
      } else {
        const errorMsg = 'Notification permission was denied';
        setError(errorMsg);
        Alert.alert('Permission Required', errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to request notification permission';
      setError(errorMsg);

      Toast.show({
        type: 'error',
        text1: 'Notification Permission Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const openAppSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notification permission in your app settings',
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
        'Notification Permission Required',
        'Please enable notification permission in your app settings',
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
    canAskAgain,
    clearError,
    error,
    hasPermission: status === 'granted' ? true : status === 'denied' ? false : null,
    loading,
    openAppSettings,
    requestPermission,
  };
}
