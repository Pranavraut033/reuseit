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
  padding?: number | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  safeArea?: boolean;
  style?: ViewStyle;
  statusBarStyle?: StatusBarStyle;
  paddingForTabs?: boolean;
  className?: string;
  contentClassName?: string;
  root?: React.ReactNode;
};

const spacingMap: Record<string, number> = {
  '3xs': 4,
  '2xs': 6,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function ScreenContainer({
  children,
  header,
  scroll = false,
  keyboardAvoiding = false,
  dismissKeyboardOnPress = keyboardAvoiding,
  safeArea = true,
  padding = 'md',
  paddingForTabs = false,
  style,
  statusBarStyle = 'dark-content',
  className,
  contentClassName,
  root,
}: ScreenContainerProps) {
  const resolvedPadding = typeof padding === 'number' ? padding : spacingMap[padding];
  const bottomPaddingForTabs = paddingForTabs ? 100 : 0;

  const scrollContent = scroll ? (
    <ScrollView
      contentContainerStyle={[
        {
          flexGrow: 1,
          padding: resolvedPadding,
          paddingBottom: resolvedPadding + bottomPaddingForTabs,
        },
        style,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        {
          flex: 1,
          padding: resolvedPadding,
          paddingBottom: resolvedPadding + bottomPaddingForTabs,
        },
        style,
      ]}
      className={contentClassName}
    >
      {children}
    </View>
  );

  const keyboardWrapper = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {scrollContent}
    </KeyboardAvoidingView>
  ) : (
    scrollContent
  );

  const dismissWrapper = dismissKeyboardOnPress ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }} className={contentClassName}>
        {keyboardWrapper}
      </View>
    </TouchableWithoutFeedback>
  ) : (
    <View style={{ flex: 1 }} className={contentClassName}>
      {keyboardWrapper}
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle={statusBarStyle} />
      {safeArea ? (
        <SafeAreaView style={{ flex: 1 }} className={`bg-canvas ${className ?? ''}`.trim()}>
          {header}
          {dismissWrapper}
          {root}
        </SafeAreaView>
      ) : (
        <View style={{ flex: 1 }} className={`bg-canvas ${className ?? ''}`.trim()}>
          {header}
          {dismissWrapper}
          {root}
        </View>
      )}
    </GestureHandlerRootView>
  );
}
