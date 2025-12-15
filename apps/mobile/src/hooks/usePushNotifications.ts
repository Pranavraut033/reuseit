import { useMutation } from '@apollo/client/react';
import * as Messaging from '@react-native-firebase/messaging';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '~/context/AuthContext';
import { REGISTER_DEVICE_TOKEN_MUTATION } from '~/gql/notification';

// Request permission for notifications
async function requestUserPermission() {
  const authStatus = await Messaging.requestPermission(Messaging.getMessaging());

  const enabled =
    authStatus === Messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === Messaging.AuthorizationStatus.PROVISIONAL;

  return enabled;
}

// Get FCM token
async function getFCMToken() {
  try {
    const fcmToken = await Messaging.getToken(Messaging.getMessaging());
    if (fcmToken) {
      return fcmToken;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  const [registerDeviceToken] = useMutation(REGISTER_DEVICE_TOKEN_MUTATION);

  useEffect(() => {
    // Request permission and get token
    const setupNotifications = async () => {
      const permissionGranted = await requestUserPermission();
      setIsPermissionGranted(permissionGranted);

      if (permissionGranted) {
        const token = await getFCMToken();
        setFcmToken(token);

        // Register device token with backend if user is logged in
        if (token && user?.id) {
          try {
            await registerDeviceToken({
              variables: {
                token,
                userId: user.id,
              },
            });
          } catch (error) {
            console.error('Failed to register FCM token with backend:', error);
          }
        }
      }
    };

    setupNotifications();

    // Foreground message handler
    const unsubscribeForeground = Messaging.onMessage(
      Messaging.getMessaging(),
      async (remoteMessage) => {
        // Show local notification for foreground messages
        Alert.alert(
          remoteMessage.notification?.title || 'Notification',
          remoteMessage.notification?.body || 'You have a new message',
          [{ text: 'OK' }],
        );
      },
    );

    // Background messages are handled by the module-level handler registered
    // in `src/firebase/backgroundMessaging.ts` so we avoid re-registering here.

    // Token refresh handler
    const unsubscribeTokenRefresh = Messaging.onTokenRefresh(
      Messaging.getMessaging(),
      async (token) => {
        setFcmToken(token);

        // Re-register updated token with backend
        if (user?.id) {
          try {
            await registerDeviceToken({
              variables: {
                token,
                userId: user.id,
              },
            });
          } catch (error) {
            console.error('Failed to register refreshed FCM token with backend:', error);
          }
        }
      },
    );

    // Handle notification opened from background/quit state
    const unsubscribeNotificationOpened = Messaging.onNotificationOpenedApp(
      Messaging.getMessaging(),
      (remoteMessage) => {
        console.log('Notifiction opened from background:', remoteMessage);
        // Handle navigation or other actions here
      },
    );

    // Check if app was opened from a notification (when app was quit)

    Messaging.getInitialNotification(Messaging.getMessaging()).then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from quit state:', remoteMessage);
        // Handle initial notification here
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
      unsubscribeNotificationOpened();
    };
  }, [registerDeviceToken, user?.id]);

  return {
    fcmToken,
    isPermissionGranted,
  };
}
