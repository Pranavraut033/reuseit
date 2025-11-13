import { AntDesign } from '@expo/vector-icons';
import { TouchableOpacity, Text, View } from 'react-native';
import { useCallback } from 'react';
import { useAppContext } from '~/context/AppContext';
import { Toast } from 'toastify-react-native';
import { useAuth } from '~/context/AuthContext';

const SignInWithGoogle: React.FC = () => {
  const { showLoading, hideLoading } = useAppContext();
  const { signInWithGoogle } = useAuth();

  const onGoogleButtonPress = useCallback(() => {
    showLoading();

    signInWithGoogle(() => {
      Toast.success('Logged in successfully', 'bottom');
    })
      .catch((error) => {
        console.log('Google login error', { error });
        Toast.error(error.message || 'Failed to sign in with Google', 'bottom');
      })
      .finally(hideLoading);
  }, [hideLoading, showLoading, signInWithGoogle]);

  return (
    <TouchableOpacity
      className="mb-6 w-full flex-row items-center justify-center rounded-lg border border-[#4285F4] bg-white py-3 shadow-sm"
      activeOpacity={0.85}
      onPress={onGoogleButtonPress}>
      <View className="mr-3 items-center justify-center rounded bg-white px-1">
        <AntDesign name="google" size={20} color="#4285F4" />
      </View>
      <Text className="text-base font-medium text-[#222]">Continue with Google</Text>
    </TouchableOpacity>
  );
};

export default SignInWithGoogle;
