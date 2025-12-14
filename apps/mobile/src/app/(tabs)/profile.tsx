import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Toast } from 'toastify-react-native';

import { Button } from '~/components/common/Button';
import ScreenContainer from '~/components/common/ScreenContainer';
import { EditProfileForm } from '~/components/profile';
import { useAuth } from '~/context/AuthContext';
import { EXPORT_USER_DATA_MUTATION, REMOVE_USER_MUTATION } from '~/gql/user';
import { t } from '~/utils/i18n';

export default function Profile() {
  const { signOut, user } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [exportUserDataMutation] = useMutation(EXPORT_USER_DATA_MUTATION);
  const [removeUserMutation] = useMutation(REMOVE_USER_MUTATION);

  const handleExportData = async () => {
    try {
      await exportUserDataMutation({
        variables: { id: user!.id },
      });
      Toast.success(t('profile.exportSuccess'));
    } catch (error) {
      console.error('Export data error:', error);
      Toast.error(t('profile.exportError'));
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('profile.deleteConfirmTitle'), t('profile.deleteConfirmMessage'), [
      {
        text: t('profile.cancel'),
        style: 'cancel',
      },
      {
        text: t('profile.deleteConfirmButton'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeUserMutation({
              variables: { id: user!.id },
            });
            Toast.success(t('profile.deleteSuccess'));
            signOut();
          } catch (error) {
            console.error('Delete account error:', error);
            Toast.error(t('profile.deleteError'));
          }
        },
      },
    ]);
  };

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
        <TouchableOpacity
          className="mt-4 rounded-lg bg-blue-500 px-4 py-2"
          onPress={() => setEditModalVisible(true)}
          accessible={true}
          accessibilityLabel="Edit Profile"
          accessibilityRole="button"
        >
          <Text className="text-white font-medium">{t('profile.editProfile')}</Text>
        </TouchableOpacity>
      </View>

      {/* Settings & Privacy Section */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-800">{t('profile.settings')}</Text>
        <Ionicons name="settings-sharp" size={20} color="#6B7280" />
      </View>

      <View className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => router.push('/posts')}
          accessible={true}
          accessibilityLabel="View My Posts"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">
            {t('profile.myPosts')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Chat Requests */}
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => router.push('/chat-requests')}
          accessible={true}
          accessibilityLabel="Manage Chat Requests"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Ionicons name="chatbubbles-outline" size={20} color="#8B5CF6" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">
            {t('profile.chatRequests')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Data Export */}
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={handleExportData}
          accessible={true}
          accessibilityLabel="Export My Data"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
            <Ionicons name="download-outline" size={20} color="#F59E42" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">
            {t('profile.exportData')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Delete Account */}
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={handleDeleteAccount}
          accessible={true}
          accessibilityLabel="Delete My Account"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-red-600">
            {t('profile.deleteAccount')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Privacy Policy */}
        <Pressable
          className="flex-row items-center px-5 py-4 active:bg-gray-50"
          onPress={() => router.push('/privacy-policy')}
          accessible={true}
          accessibilityLabel="Privacy Policy"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-gray-800">
            {t('profile.privacyPolicy')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Sign Out Button */}
      <Button
        title={t('profile.signOut')}
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

      {/* Edit Profile Bottom Sheet */}
      <EditProfileForm isVisible={editModalVisible} onClose={() => setEditModalVisible(false)} />
    </ScreenContainer>
  );
}
