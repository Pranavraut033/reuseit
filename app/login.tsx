import { SafeAreaView, Text, View } from 'react-native';

import SignInWithGoogle from '~/components/Auth/SignInWithGoogle';
import SignInWithPhone from '~/components/Auth/SignInWithPhone';
import SignInWithApple from '~/components/Auth/SignInWithApple';
import { useAuth } from '~/context/AuthContext';
import { Redirect, usePathname } from 'expo-router';

export default function Login() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (user && pathname === '/login') return <Redirect href="/" />;

  return (
    <SafeAreaView className="flex-1 items-center justify-center  bg-white px-6">
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
    </SafeAreaView>
  );
}
