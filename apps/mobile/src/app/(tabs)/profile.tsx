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
  const { signOut, user, sendEmailVerification } = useAuth();
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
      <ScreenContainer scroll paddingForTabs>
        <View className="flex-1 items-center justify-center rounded-xl bg-white p-8 shadow-card">
          <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
          <Text className="mt-4 text-center text-lg font-semibold text-forest">
            Please log in to view your profile.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll paddingForTabs>
      {/* Profile Header Card */}
      <View className="mb-6 mt-4 items-center rounded-lg bg-white p-6 shadow-card">
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name="person-circle-outline" size={64} color="#2ECC71" />
        </View>
        <Text className="text-2xl font-bold text-forest">{user.name || 'Guest'}</Text>
        <Text className="mt-2 text-base text-gray-600">{user.email || 'N/A'}</Text>
        <TouchableOpacity
          className="mt-4 rounded-md bg-primary px-4 py-2 shadow-card"
          onPress={() => setEditModalVisible(true)}
          accessible={true}
          accessibilityLabel="Edit Profile"
          accessibilityRole="button"
        >
          <Text className="font-medium text-white">{t('profile.editProfile')}</Text>
        </TouchableOpacity>
      </View>

      {/* Settings & Privacy Section */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-forest">{t('profile.settings')}</Text>
        <Ionicons name="settings-sharp" size={20} color="#6B7280" />
      </View>

      <View className="mb-6 overflow-hidden rounded-xl bg-white shadow-card">
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={() => router.push('/posts')}
          accessible={true}
          accessibilityLabel="View My Posts"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <Ionicons name="document-text-outline" size={20} color="#3498DB" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-forest">
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
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <Ionicons name="chatbubbles-outline" size={20} color="#8B5CF6" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-forest">
            {t('profile.chatRequests')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Email Verification (if applicable) */}
        {user?.email && !user?.emailVerified && (
          <Pressable
            className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
            onPress={async () => {
              try {
                await sendEmailVerification?.(() => {});
                Toast.success(t('profile.verifyEmailSent'));
              } catch (error) {
                console.error('Send verification email error:', error);
                Toast.error(t('profile.verifyEmailError'));
              }
            }}
            accessible={true}
            accessibilityLabel="Verify Email"
            accessibilityRole="button"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="mail-unread-outline" size={20} color="#F59E42" />
            </View>
            <Text className="ml-4 flex-1 text-base font-medium text-forest">
              {t('profile.verifyEmail')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        )}

        {user?.email && user?.emailVerified && (
          <Pressable
            className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
            accessible={true}
            accessibilityLabel="Email Verified"
            accessibilityRole="text"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </View>
            <Text className="ml-4 flex-1 text-base font-medium text-forest">
              {t('profile.emailVerified')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        )}

        {/* Data Export */}
        <Pressable
          className="flex-row items-center border-b border-gray-100 px-5 py-4 active:bg-gray-50"
          onPress={handleExportData}
          accessible={true}
          accessibilityLabel="Export My Data"
          accessibilityRole="button"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-earth-accent/10">
            <Ionicons name="download-outline" size={20} color="#F59E42" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-forest">
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
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
          </View>
          <Text className="ml-4 flex-1 text-base font-medium text-forest">
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
      <View className="items-center pb-6">
        <Text className="text-center text-sm text-gray-500">
          Made with <Text style={{ color: '#e11d48' }}>♥</Text> in Germany
        </Text>
      </View>

      {/* Edit Profile Bottom Sheet */}
      <EditProfileForm isVisible={editModalVisible} onClose={() => setEditModalVisible(false)} />
    </ScreenContainer>
  );
}
