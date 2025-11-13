import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import SignInWithGoogle from '~/src/components/Auth/SignInWithGoogle';
import SignInWithPhone from '~/src/components/Auth/SignInWithPhone';
import SignInWithApple from '~/src/components/Auth/SignInWithApple';
import { useAuth } from '~/src/context/AuthContext';
import { Redirect, usePathname } from 'expo-router';
import { Container } from '~/src/components/common/Container';
import { PortalHost } from '@rn-primitives/portal';
import { ScrollView } from 'react-native-gesture-handler';

export default function Login() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (user && pathname === '/login') return <Redirect href="/" />;

  return (
    <Container>
      <ScrollView>

        <View>
          <View className="flex-1"></View>
          <View className="mb-6">
            <View className="h-24 w-24 items-center justify-center rounded-xl bg-gray-300">
              <Text className="text-3xl">♻️</Text>
            </View>
          </View>

          <Text className="mb-1 text-xl font-semibold text-gray-900">Welcome to ReUseIt</Text>
          <Text className="mb-4 text-center text-gray-500">
            Sign in to start your recycling journey
          </Text>
          <View className="flex-1"></View>

          <SignInWithApple />

          <SignInWithGoogle />

          <View className="mb-4 w-full flex-row items-center">
            <View className="h-px flex-1 bg-gray-300" />
            <Text className="mx-2 text-gray-400">OR</Text>
            <View className="h-px flex-1 bg-gray-300" />
          </View>

          <SignInWithPhone />

          <View className="flex-1"></View>
          <Text className="mb-2 mt-4 text-center text-sm text-gray-500">
            By continuing, you agree to our{' '}
            <Text className="text-green-600 underline">Terms of Service</Text> and{' '}
            <Text className="text-green-600 underline">Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>

      <PortalHost name="root" />
    </Container>
  );
}
