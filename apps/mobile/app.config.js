/** @type {import('@expo/config').ExpoConfig} */
try {
  // Load .env for local development if dotenv is available. Do not fail if it's missing
  // (e.g., when tools run from environments that don't have it installed).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch (e) {
  // ignore - dotenv is optional at runtime for Expo tooling
}

module.exports = {
  expo: {
    name: 'Reuseit',
    slug: 'reuseit',
    version: '1.0.0',
    scheme: 'reuseit',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-web-browser',
      'expo-font',
      'expo-asset',
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'The app accesses your photos to let you share them with your friends.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
        },
      ],
      // Custom plugin to add Android network_security_config.xml and set app attribute
      './plugins/add-security-config-plugin.js',
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 26,
            usesCleartextTraffic: true,
          },
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      'expo-secure-store',
      'react-native-vision-camera',
      ['expo-notifications'],
      '@react-native-firebase/messaging',
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFE2',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'ai.reuseit.app',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      googleServicesFile: './GoogleService-Info.plist',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      minSdkVersion: 26,
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundImage: './assets/adaptive-icon.png',
      },
      icon: './assets/logo.png',
      googleServicesFile: './google-services.json',
      package: 'ai.reuseit.app',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    extra: {
      // runtime-accessible app URL (falls back to localhost for local dev)
      appUrl: process.env.EXPO_PUBLIC_APP_URL ?? 'http://91.98.231.10',
      router: {},
      eas: {
        projectId: '5d93e3bd-d633-4646-b468-4243d5e5228f',
      },
    },
  },
};
