import 'react-native-reanimated';
import '../../global.css';
import '~/firebase/backgroundMessaging';

import { ApolloProvider } from '@apollo/client/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ToastManager from 'toastify-react-native';

import { SplashScreenController } from '~/components/SplashScreenController';
import { AppProvider } from '~/context/AppContext';
import { AuthProvider, useAuth } from '~/context/AuthContext';
import { usePushNotifications } from '~/hooks/usePushNotifications';
import { useStore } from '~/store';
import { apolloClient } from '~/utils/apollo';

import Login from './login';
import Onboarding, { useFullAppPermissionsGranted } from './onboarding';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <SplashScreenController />
              <App />
              <ToastManager />
            </AppProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}

function App() {
  const { user } = useAuth();
  const onboardingCompleted = useStore((state) => state.onboardingCompleted);
  const pathname = usePathname();
  const allPermissionsGranted = useFullAppPermissionsGranted();

  usePushNotifications();

  if (!user && pathname !== '/login') return <Login />;

  if (user && pathname !== '/onboarding' && (!onboardingCompleted || !allPermissionsGranted))
    return <Onboarding />;

  return (
    <Stack screenOptions={{ statusBarStyle: 'dark', headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{}} />
      <Stack.Screen name="login" options={{}} />
      <Stack.Screen name="onboarding" options={{}} />
      <Stack.Screen name="waste-analysis/index" options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="posts/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="posts/create" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="posts/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="events/create" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="events/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
