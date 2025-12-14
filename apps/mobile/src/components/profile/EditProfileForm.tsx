import { useMutation } from '@apollo/client/react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import { Text, TouchableOpacity, View } from 'react-native';
import { Toast } from 'toastify-react-native';
import * as yup from 'yup';

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
    <BottomSheet
      index={0}
      snapPoints={['85%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: 'white' }}
    >
      <BottomSheetView className="flex-1">
        <FormProvider {...methods}>
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
              <TouchableOpacity onPress={onClose}>
                <Text className="text-blue-500 text-lg">{t('profile.cancel')}</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">{t('profile.editProfile')}</Text>
              <TouchableOpacity
                onPress={handleSubmit(handleEditProfile as any)}
                disabled={isSubmitting}
              >
                <Text className={`text-lg ${isSubmitting ? 'text-gray-400' : 'text-blue-500'}`}>
                  {t('profile.save')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <View className="flex-1 p-4">
              <TextField name="name" label={t('profile.name')} placeholder="Enter your name" />

              <TextField
                name="username"
                label={t('profile.username')}
                placeholder="Enter your username"
              />

              <TextField
                name="phoneNumber"
                label={t('profile.phone')}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />

              <View className="mt-4">
                <Text className="text-sm text-gray-600 mb-2">{t('profile.email')}</Text>
                <Text className="text-base text-gray-800 bg-gray-100 p-3 rounded-lg">
                  {user?.email}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">Email cannot be changed</Text>
              </View>
            </View>
          </View>
        </FormProvider>
      </BottomSheetView>
    </BottomSheet>
  );
};
