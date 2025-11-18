import { usePathname } from 'expo-router';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import cn from '~/utils/cn';

type ContainerProps = {
  children: React.ReactNode;
  noPadding?: boolean;
  paddingForTabs?: boolean;
};

const PATH_WITH_TABS = ['/', '/explore', '/rewards', '/scan', '/profile'];

const Container: React.FC<ContainerProps> = ({ children, noPadding, paddingForTabs }) => {
  const pathname = usePathname();

  return (
    <SafeAreaView className="flex-1 bg-container">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className={cn('flex-1 ', {
              'p-4': !noPadding,
              'pb-24': paddingForTabs && PATH_WITH_TABS.includes(pathname),
            })}
          >
            {children}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Container;
