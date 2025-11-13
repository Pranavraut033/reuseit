import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable } from 'react-native';
import { Button } from '~/components/common/Button';
import { Container } from '~/components/common/Container';
import { useAuth } from '~/context/AuthContext';
import { router } from 'expo-router';

export default function Home() {
  const { signOut, user } = useAuth();

  if (!user) {
    return (
      <Container>
        <View className="flex-1 items-center justify-center rounded-xl bg-white p-8 shadow-sm">
          <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
          <Text className="mt-4 text-center text-lg font-semibold text-gray-700">
            Please log in to view your profile.
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container paddingForTabs>
      {/* Profile Header Card */}
      <View className="mb-6 mt-4 items-center rounded-2xl bg-white p-6 shadow-md">
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-blue-100">
          <Ionicons name="person-circle-outline" size={64} color="#3B82F6" />
        </View>
        <Text className="text-2xl font-bold text-gray-800">{user.name || 'Guest'}</Text>
        <Text className="mt-2 text-base text-gray-600">{user.email || 'N/A'}</Text>
      </View>

      {/* Settings Section */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-800">Settings</Text>
        <Ionicons name="settings-sharp" size={20} color="#6B7280" />
      </View>

      <View className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => router.push('/my-posts')}
          accessible={true}
          accessibilityLabel="View My Posts"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">My Posts</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => {
            /* TODO: navigate to account */
          }}
          accessible={true}
          accessibilityLabel="Account Settings"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Ionicons name="settings-outline" size={20} color="#7C3AED" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">Account Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => {
            /* TODO: navigate to notifications */
          }}
          accessible={true}
          accessibilityLabel="Notifications"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        <Pressable
          className="flex-row items-center px-5 py-4 active:bg-gray-50"
          onPress={() => {
            /* TODO: navigate to help */
          }}
          accessible={true}
          accessibilityLabel="Help & Support"
          accessibilityRole="button">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="help-circle-outline" size={20} color="#10B981" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">Help & Support</Text>
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
    </Container>
  );
}
