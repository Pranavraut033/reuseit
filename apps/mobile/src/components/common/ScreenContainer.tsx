import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  dismissKeyboardOnPress?: boolean;
  padding?: number;
  safeArea?: boolean;
  style?: ViewStyle;
  statusBarStyle?: StatusBarStyle;
  paddingForTabs?: boolean;
  root?: React.ReactNode;
};

export default function ScreenContainer({
  children,
  header,
  scroll = false,
  keyboardAvoiding = false,
  dismissKeyboardOnPress = keyboardAvoiding,
  safeArea = true,
  padding = 16,
  paddingForTabs = false,
  style,
  statusBarStyle = 'dark-content',
  root,
}: ScreenContainerProps) {
  const scrollContent = scroll ? (
    <ScrollView
      contentContainerStyle={[{ flexGrow: 1, padding }, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding }, style]}>{children}</View>
  );

  const keyboardWrapper = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {scrollContent}
    </KeyboardAvoidingView>
  ) : (
    scrollContent
  );

  const dismissWrapper = dismissKeyboardOnPress ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>{keyboardWrapper}</View>
    </TouchableWithoutFeedback>
  ) : (
    <View style={{ flex: 1 }}>{keyboardWrapper}</View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={statusBarStyle} />
      {safeArea ? (
        <SafeAreaView style={{ flex: 1, paddingBottom: paddingForTabs ? 100 : 0 }}>
          {header}
          {dismissWrapper}
          {root}
        </SafeAreaView>
      ) : (
        <>
          {header}
          {dismissWrapper}
          {root}
        </>
      )}
    </GestureHandlerRootView>
  );
}
