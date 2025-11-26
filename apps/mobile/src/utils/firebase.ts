import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase, { initializeApp, ReactNativeFirebase } from '@react-native-firebase/app';
import { FirebaseAuthTypes, initializeAuth } from '@react-native-firebase/auth';

firebase.setReactNativeAsyncStorage(AsyncStorage);

let app: ReactNativeFirebase.FirebaseApp;
let auth: FirebaseAuthTypes.Module;

(async () => {
  app = await initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    // databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID!,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  });
  auth = initializeAuth(app);
})().catch((error: Error) => {
  console.error('Firebase initialization error', { error });
});

export { app, auth };
