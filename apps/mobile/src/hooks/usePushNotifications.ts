import { useMutation } from '@apollo/client/react';
import messaging from '@react-native-firebase/messaging';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '~/context/AuthContext';
import { REGISTER_DEVICE_TOKEN_MUTATION } from '~/gql/notification';

// Request permission for notifications
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.info('Authorization status:', authStatus);
  }

  return enabled;
}

// Get FCM token
async function getFCMToken() {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
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
              console.log('FCM Token registered with backend');
            } catch (error) {
              console.error('Failed to register FCM token with backend:', error);
            }
          }
        }
      }
    };

    setupNotifications();

    // Foreground message handler
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);

      // Show local notification for foreground messages
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || 'You have a new message',
        [{ text: 'OK' }],
      );
    });

    // Background message handler (when app is in background)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      // Handle background messages here
    });

    // Token refresh handler
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
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
          console.log('Refreshed FCM Token registered with backend');
        } catch (error) {
          console.error('Failed to register refreshed FCM token with backend:', error);
        }
      }
    });

    // Handle notification opened from background/quit state
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
      // Handle navigation or other actions here
    });

    // Check if app was opened from a notification (when app was quit)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
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
