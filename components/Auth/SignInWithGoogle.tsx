import { AntDesign } from '@expo/vector-icons';
import { TouchableOpacity, Text, View } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import { useCallback } from 'react';
import { useAppContext } from '~/context/AppContext';
import { Toast } from 'toastify-react-native';
import { useAuth } from '~/context/AuthContext';

GoogleSignin.configure({
  webClientId: '54651170211-hbq96bq9l72ovsftr62odvbumsd431k0.apps.googleusercontent.com',
  iosClientId: '54651170211-pm2no130q54k86le3tbat9p5b5r5g2ik.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ],
});

const SignInWithGoogle: React.FC = () => {
  const { showLoading, hideLoading } = useAppContext();
  useAuth();
  const onGoogleButtonPress = useCallback(() => {
    showLoading();

    openGoogleLogin()
      .then(() => {
        console.log('redirect to home');
      })
      .catch((error) => {
        console.log('Google login error', { error });
        Toast.error(error.message, 'bottom');
      })
      .finally(hideLoading);
  }, [hideLoading, showLoading]);

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

async function openGoogleLogin() {
  // Check if your device supports Google Play
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Get the users ID token
  const signInResult = await GoogleSignin.signIn();

  // Try the new style of google-sign in result, from v13+ of that module
  let idToken = signInResult.data?.idToken;
  if (!idToken) {
    // if you are using older versions of google-signin, try old style result
    idToken = (signInResult as any).idToken;
  }

  if (!idToken) {
    throw new Error('No ID token found');
  }

  // Create a Google credential with the token
  const googleCredential = GoogleAuthProvider.credential(idToken);

  // Sign-in the user with the credential
  return signInWithCredential(getAuth(), googleCredential);
}

export default SignInWithGoogle;
