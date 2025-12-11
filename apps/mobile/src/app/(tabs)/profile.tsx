import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '~/components/common/Button';
import ScreenContainer from '~/components/common/ScreenContainer';
import { useAuth } from '~/context/AuthContext';

export default function Home() {
  const { signOut, user } = useAuth();

  if (!user) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center rounded-xl bg-white p-8 shadow-sm">
          <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
          <Text className="mt-4 text-center text-lg font-semibold text-gray-700">
            Please log in to view your profile.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Profile Header Card */}
      <View className="mb-6 mt-4 items-center rounded-2xl bg-white p-6 shadow-md">
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-blue-100">
          <Ionicons name="person-circle-outline" size={64} color="#3B82F6" />
        </View>
        <Text className="text-2xl font-bold text-gray-800">{user.name || 'Guest'}</Text>
        <Text className="mt-2 text-base text-gray-600">{user.email || 'N/A'}</Text>
      </View>

      {/* Settings & Privacy Section */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-800">Settings & Privacy</Text>
        <Ionicons name="settings-sharp" size={20} color="#6B7280" />
      </View>

      <View className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => router.push('/posts')}
          accessible={true}
          accessibilityLabel="View My Posts"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">My Posts</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Data Export */}
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => {
            /* TODO: Call backend exportUserData mutation and download data */
          }}
          accessible={true}
          accessibilityLabel="Export My Data"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
            <Ionicons name="download-outline" size={20} color="#F59E42" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">Export My Data</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Delete Account */}
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => {
            /* TODO: Call backend removeUser mutation and sign out */
          }}
          accessible={true}
          accessibilityLabel="Delete My Account"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-red-600">Delete My Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Privacy Policy */}
        <Pressable
          className="flex-row items-center px-5 py-4 active:bg-gray-50"
          onPress={() => router.push('/privacy-policy')}
          accessible={true}
          accessibilityLabel="Privacy Policy"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Sign Out Button */}
      <Button
        title="Sign Out"
        className="mb-6"
        icon={({ size, color }) => <Ionicons name="log-out-outline" size={size} color={color} />}
        type="error"
        onPress={signOut}
        accessible={true}
        accessibilityLabel="Sign out of your account"
        accessibilityRole="button"
      />

      {/* Footer */}
      <View className="mt-auto items-center pb-4">
        <Text className="text-center text-sm text-gray-500">
          Made with <Text style={{ color: '#e11d48' }}>♥</Text> in Germany
        </Text>
      </View>
    </ScreenContainer>
  );
}
