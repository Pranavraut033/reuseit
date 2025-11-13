import { Platform, View, Text, StyleSheet } from 'react-native';
import type { ComponentProps } from 'react';

// Define Region type inline to avoid importing from react-native-maps on web
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Lazy-load react-native-maps only on native platforms
let MapView: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

// Web fallback component
const WebMapPlaceholder = ({ style }: { style?: any }) => (
  <View style={[styles.placeholder, style]}>
    <Text style={styles.placeholderText}>🗺️ Map view is only available on iOS and Android</Text>
    <Text style={styles.placeholderSubtext}>
      Please use the mobile app to explore events on the map
    </Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

// Export platform-aware MapView
export const PlatformMapView = Platform.OS === 'web' ? WebMapPlaceholder : MapView;

// Export constants (will be undefined on web, but won't be used)
export { PROVIDER_GOOGLE };

// Type-safe exports for TypeScript
export type MapViewProps = ComponentProps<typeof MapView>;
