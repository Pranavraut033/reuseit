import { Platform, StatusBar } from 'react-native';

export default function useStatusBarHeight(): number {
  return Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 32;
}
