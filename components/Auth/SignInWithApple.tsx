import { AntDesign } from '@expo/vector-icons';
import { TouchableOpacity, Text, View } from 'react-native';

const SignInWithApple: React.FC = () => {
  return (
    <TouchableOpacity
      className="mb-6 w-full flex-row items-center justify-center rounded-lg border border-black bg-white py-3 shadow-sm"
      activeOpacity={0.85}>
      <View className="mr-3 items-center justify-center rounded bg-white px-1">
        <AntDesign name="apple1" size={20} color="#000" />
      </View>
      <Text className="text-base font-medium text-black">Continue with Apple</Text>
    </TouchableOpacity>
  );
};

export default SignInWithApple;
