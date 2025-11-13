import { usePathname } from 'expo-router';
import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
  Text,
  Platform,
  TouchableWithoutFeedback,
  Button,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import cn from '~/src/utils/cn';

type ContainerProps = {
  children: React.ReactNode;
  noPadding?: boolean;
  paddingForTabs?: boolean;
};

const PATH_WITH_TABS = ['/', 'explore', '/rewards', '/scan'];


export const Container: React.FC<ContainerProps> = ({ children, noPadding, paddingForTabs }) => {
  if (noPadding) { return children }
  const pathname = usePathname();
  console.log({ pathname });


  return (
    <SafeAreaView className="flex-1 bg-container">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className={cn(
            'flex-1 p-4',
            {
              'pb-24': paddingForTabs && PATH_WITH_TABS.includes(pathname),
            }
          )}>
            {children}
          </View>
        </TouchableWithoutFeedback >
      </KeyboardAvoidingView >
    </SafeAreaView >
  );
};
export default Container;