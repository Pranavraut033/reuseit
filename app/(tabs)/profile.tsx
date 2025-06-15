import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable } from 'react-native';
import { Container } from '~/components/Container';
import { useAuth } from '~/context/AuthContext';

export default function Home() {
  const { signOut, user } = useAuth();

  return (
    <Container>
      <Ionicons name="person-circle-outline" size={80} color="#64748b" />
      <Text className="mt-4 text-xl font-semibold text-slate-700">Profile</Text>
      {/* User Info */}
      <View className="mt-6 w-full items-center rounded-lg bg-slate-100  py-4">
        <Text className="text-base text-slate-600">Name: {user?.displayName || 'N/A'}</Text>
        <Text className="mt-1 text-base text-slate-600">Email: {user?.email || 'N/A'}</Text>
      </View>
      {/* Settings List */}
      <View className="mt-8 w-full ">
        <Text className="mb-2 text-lg font-semibold text-slate-700">Settings</Text>
        <View className="divide-y divide-slate-200 rounded-lg bg-white shadow-sm">
          <Pressable
            className="flex-row items-center px-4 py-3"
            onPress={() => {
              /* TODO: navigate to account */
            }}>
            <Ionicons name="settings-outline" size={20} color="#64748b" />
            <Text className="ml-3 text-base text-slate-700">Account Settings</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center px-4 py-3"
            onPress={() => {
              /* TODO: navigate to notifications */
            }}>
            <Ionicons name="notifications-outline" size={20} color="#64748b" />
            <Text className="ml-3 text-base text-slate-700">Notifications</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center px-4 py-3"
            onPress={() => {
              /* TODO: navigate to help */
            }}>
            <Ionicons name="help-circle-outline" size={20} color="#64748b" />
            <Text className="ml-3 text-base text-slate-700">Help & Support</Text>
          </Pressable>
        </View>
        <Pressable
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          className="mb-8 mt-4 flex flex-row items-center justify-center rounded-md bg-red-600 px-6 py-3"
          style={{ elevation: 2 }}
          onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text className="ml-3 font-medium text-white">Sign Out</Text>
        </Pressable>
      </View>
      {/* Sign Out Button */}
    </Container>
  );
}
