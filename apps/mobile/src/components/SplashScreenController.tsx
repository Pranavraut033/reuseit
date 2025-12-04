import { SplashScreen } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '~/context/AuthContext';

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading, isReady } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (isReady && !isLoading) {
      SplashScreen.hideAsync();
      ranRef.current = true;
    }
  }, [isReady, isLoading]);

  return null;
}
