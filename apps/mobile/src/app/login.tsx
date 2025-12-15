import { Redirect, router, usePathname } from 'expo-router';
import { Text, View } from 'react-native';

import SignInWithEmail from '~/components/Auth/SignInWithEmail';
import SignInWithGoogle from '~/components/Auth/SignInWithGoogle';
// import SignInWithPhone from '~/components/Auth/SignInWithPhone';
import Card from '~/components/common/Card';
import ScreenContainer from '~/components/common/ScreenContainer';
import { useAuth } from '~/context/AuthContext';

export default function Login() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (user && pathname === '/login') return <Redirect href="/" />;

  return (
    <ScreenContainer scroll className="bg-canvas">
      <View className="items-center">
        <View className="mb-6 items-center">
          <Card className="h-28 w-28 items-center justify-center rounded-full">
            <Text className="text-4xl">♻️</Text>
          </Card>
        </View>

        <Text className="mb-1 text-2xl font-semibold text-forest">Welcome to ReUseIt</Text>
        <Text className="mb-6 text-center text-gray-600">
          Sign in to start your recycling journey
        </Text>

        <SignInWithEmail />

        <View className="my-4 w-full flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-2 text-sm text-gray-400">OR</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        <SignInWithGoogle />
        {/* <SignInWithPhone /> */}

        <Text className="mb-2 mt-6 text-center text-sm text-gray-600">
          By continuing, you agree to our{' '}
          <Text className="text-primary underline">Terms of Service</Text> and{' '}
          <Text className="text-primary underline" onPress={() => router.push('/privacy-policy')}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </ScreenContainer>
  );
}
