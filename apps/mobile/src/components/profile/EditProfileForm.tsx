import { useMutation } from '@apollo/client/react';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from 'toastify-react-native';
import * as yup from 'yup';

import { Button } from '~/components/common/Button';
import { TextField } from '~/components/form';
import { useAuth } from '~/context/AuthContext';
import { UPDATE_USER_MUTATION } from '~/gql/user';
import { User } from '~/store';
import { t } from '~/utils/i18n';

interface EditProfileFormData {
  name: string;
  phoneNumber: string | undefined;
}

const editProfileSchema: yup.ObjectSchema<EditProfileFormData> = yup.object().shape({
  name: yup.string().required(t('profile.nameRequired')).min(2, t('profile.nameMinLength')),
  phoneNumber: yup
    .string()
    .optional()
    .matches(/^\+?[0-9\s\-\(\)]+$/, t('profile.phoneInvalid')),
});

interface EditProfileFormProps {
  isVisible: boolean;
  onClose: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ isVisible, onClose }) => {
  const { user, updateUser } = useAuth();
  const [updateUserMutation] = useMutation(UPDATE_USER_MUTATION);
  const insets = useSafeAreaInsets();

  const methods = useForm({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const handleEditProfile = async (data: EditProfileFormData) => {
    try {
      const result = await updateUserMutation({
        variables: {
          updateUserInput: {
            id: user!.id,
            ...data,
          },
        },
      });

      if (result.data?.updateUser && user) {
        // Update the user in the store with the new data
        const updatedUser: User = {
          ...user,
          ...result.data.updateUser,
        };
        updateUser(updatedUser);
        Toast.success(t('profile.updateSuccess'));
        onClose();
        reset(data);
      }
    } catch (error: unknown) {
      console.error('Update profile error:', error);
      Toast.error(t('profile.updateError'));
    }
  };

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <Pressable onPress={onClose} className="absolute inset-0 bg-black/40" accessible={false} />
      <BottomSheet
        index={1}
        snapPoints={['40%', '85%']}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{
          backgroundColor: 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
        handleIndicatorStyle={{ backgroundColor: '#E5E7EB', width: 40, height: 4 }}
        style={{ paddingBottom: insets.bottom ?? 16, shadowColor: '#000', shadowOpacity: 0.05 }}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize">
        <BottomSheetView className="flex-1">
          <FormProvider {...methods}>
            <View className="flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
                <TouchableOpacity onPress={onClose} accessibilityRole="button">
                  <Text className="text-base text-forest">{t('profile.cancel')}</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-forest">{t('profile.editProfile')}</Text>
                <View className="ml-2">
                  <Button
                    title={t('profile.save')}
                    size="small"
                    type="primary"
                    onPress={handleSubmit(handleEditProfile as any)}
                    disabled={isSubmitting}
                  />
                </View>
              </View>

              {/* Form Content (scrollable) */}
              <BottomSheetScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 16, paddingBottom: (insets.bottom ?? 16) + 24 }}>
                <TextField name="name" label={t('profile.name')} placeholder="Enter your name" />

                <TextField
                  name="phoneNumber"
                  label={t('profile.phone')}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />

                <View className="mt-4">
                  <Text className="mb-2 text-sm text-forest">{t('profile.email')}</Text>
                  <Text className="rounded-lg bg-gray-100 p-3 text-base text-forest">
                    {user?.email}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-500">Email cannot be changed</Text>
                </View>
              </BottomSheetScrollView>
            </View>
          </FormProvider>
        </BottomSheetView>
      </BottomSheet>
    </Modal>
  );
};
