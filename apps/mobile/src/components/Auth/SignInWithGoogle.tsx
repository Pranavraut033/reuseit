import { AntDesign } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Toast } from 'toastify-react-native';

import { useAppContext } from '~/context/AppContext';
import { useAuth } from '~/context/AuthContext';
import { t } from '~/utils/i18n';

const SignInWithGoogle: React.FC = () => {
  const { showLoading, hideLoading } = useAppContext();
  const { signInWithGoogle } = useAuth();

  const onGoogleButtonPress = useCallback(() => {
    showLoading();

    signInWithGoogle(() => {
      Toast.success(t('auth.loggedIn'), 'bottom');
    }).finally(hideLoading);
  }, [hideLoading, showLoading, signInWithGoogle]);

  return (
    <TouchableOpacity
      className="mb-6 w-full flex-row items-center justify-center rounded-md border border-primary bg-white py-3 shadow-card"
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('auth.continueWithGoogle')}
      onPress={onGoogleButtonPress}
    >
      <View className="mr-3 items-center justify-center rounded bg-white px-1">
        <AntDesign name="google" size={20} color="#4285F4" />
      </View>
      <Text className="text-base font-medium text-forest">{t('auth.continueWithGoogle')}</Text>
    </TouchableOpacity>
  );
};

export default SignInWithGoogle;
