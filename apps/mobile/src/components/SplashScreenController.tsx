import { SplashScreen } from 'expo-router';
import { useAuth } from '~/src/context/AuthContext';

export function SplashScreenController() {
  const { isLoading } = useAuth();

  if (!isLoading) {
    SplashScreen.hideAsync();
  }

  return null;
}
