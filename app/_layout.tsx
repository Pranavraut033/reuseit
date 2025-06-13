import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Redirect, Stack, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '~/context/AuthContext';
import { SplashScreenController } from '~/components/SplashScreenController';
import { PortalHost } from '@rn-primitives/portal';
import ToastManager from 'toastify-react-native';
import { AppProvider } from '~/context/AppContext';
import 'react-native-reanimated';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '~/utils/apollo';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <AppProvider>
        <AuthProvider>
          <SplashScreenController />
          <App />
          <ToastManager />
        </AuthProvider>
      </AppProvider>
    </ApolloProvider>
  );
}

function App() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user && pathname !== '/login') return <Redirect href="/login" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ statusBarStyle: 'dark', headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{}} />
        <Stack.Screen name="login" options={{}} />
        <Stack.Screen
          name="identify/index"
          options={{
            animation: 'fade_from_bottom',
            statusBarTranslucent: true,
            navigationBarHidden: true,
            gestureEnabled: true,
            gestureDirection: 'vertical',
            statusBarHidden: true,
          }}
        />
      </Stack>
      <PortalHost />
    </GestureHandlerRootView>
  );
}
