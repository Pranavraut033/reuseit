import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Redirect, Stack, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '~/context/AuthContext';
import { SplashScreenController } from '~/components/SplashScreenController';
import { PortalProvider } from '@gorhom/portal';
import ToastManager from 'toastify-react-native';
import { AppProvider } from '~/context/AppContext';
import 'react-native-reanimated';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthProvider>
        <SplashScreenController />
        <App />
        <ToastManager />
      </AuthProvider>
    </AppProvider>
  );
}

function App() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user && pathname !== '/login') return <Redirect href="/login" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
