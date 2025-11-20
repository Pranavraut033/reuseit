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

  /** Enable scrolling */
  scroll?: boolean;

  /** Enable keyboard avoiding behavior */
  keyboardAvoiding?: boolean;

  /** Dismiss keyboard on outside press */
  dismissKeyboardOnPress?: boolean;

  /** Apply padding inside the content */
  padding?: number;

  /** Add SafeAreaView */
  safeArea?: boolean;

  /** Style overrides */
  style?: ViewStyle;

  /** Hide or style the StatusBar */
  statusBarStyle?: StatusBarStyle;

  /** Additional className for styling */
  className?: string;
};

export default function ScreenContainer({
  children,
  scroll = false,
  keyboardAvoiding = false,
  dismissKeyboardOnPress = keyboardAvoiding,
  safeArea = true,
  padding = 16,
  style,
  statusBarStyle = 'dark-content',
}: ScreenContainerProps) {
  const ContentWrapper = scroll ? ScrollView : View;

  const Base = (
    <ContentWrapper
      className="flex-1"
      contentContainerStyle={scroll ? [{ padding }, style] : undefined}
      style={!scroll ? [{ padding }, style] : undefined}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ContentWrapper>
  );

  const WrappedWithKeyboard = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {Base}
    </KeyboardAvoidingView>
  ) : (
    Base
  );

  const WrappedWithDismiss = dismissKeyboardOnPress ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>{WrappedWithKeyboard}</View>
    </TouchableWithoutFeedback>
  ) : (
    WrappedWithKeyboard
  );

  const FinalSafeArea = safeArea ? (
    <SafeAreaView style={{ flex: 1 }}>{WrappedWithDismiss}</SafeAreaView>
  ) : (
    <View style={{ flex: 1 }}>{WrappedWithDismiss}</View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={statusBarStyle} />
      {FinalSafeArea}
    </GestureHandlerRootView>
  );
}
