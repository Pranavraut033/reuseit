/** @type {import('@expo/config').ExpoConfig} */
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
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
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
        googleMapsApiKey:
          process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyA4aO_IW6Zla8UuO3EBULzeq1cnMVmXINQ',
      },
    },
    android: {
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
          apiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyA4aO_IW6Zla8UuO3EBULzeq1cnMVmXINQ',
        },
      },
    },
    extra: {
      router: {},
      eas: {
        projectId: '5d93e3bd-d633-4646-b468-4243d5e5228f',
      },
    },
  },
};
