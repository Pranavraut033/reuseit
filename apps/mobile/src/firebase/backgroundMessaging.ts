import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Register background message handler at module load time so it runs even when
// the app is in the background or quit state. This avoids registering inside
// component hooks which can be too late for background messages.
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  try {
    console.log('Background message received:', remoteMessage);
    // Add any background processing needed here (analytics, silent updates, etc.)
  } catch (error) {
    console.error('Error handling background message', error);
  }
});

export {};
