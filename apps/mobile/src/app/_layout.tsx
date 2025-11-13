import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../../global.css';

import { AuthProvider, useAuth } from '~/context/AuthContext';
import { Stack, usePathname } from 'expo-router';

import { ApolloProvider } from '@apollo/client/react';
import { AppProvider } from '~/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Login from './login';
import { PortalHost } from '@rn-primitives/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreenController } from '~/components/SplashScreenController';
import ToastManager from 'toastify-react-native';
import { apolloClient } from '~/utils/apollo';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

export default function RootLayout() {

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ApolloProvider client={apolloClient}>
          <AppProvider>
            <AuthProvider>
              <SplashScreenController />
              <App />
              <PortalHost />
              <ToastManager />
            </AuthProvider>
          </AppProvider>
        </ApolloProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>

  );
}

function App() {
  const { user } = useAuth();
  const pathname = usePathname();
  console.log({ user });

  if (!user && pathname !== '/login')
    return <Login />;


  return (
    <Stack screenOptions={{ statusBarStyle: 'dark', headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{}} />
      <Stack.Screen name="login" options={{}} />
      <Stack.Screen name="identify/index" options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="posts/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="posts/create" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="posts/[postId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
