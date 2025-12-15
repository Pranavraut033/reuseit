import React from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  accessibilityLabel?: string;
}

const PRIMARY_COLOR = '#2ECC71';

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, text, accessibilityLabel }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
    <View className="flex-1 items-center justify-center bg-black/50">
      <View className="items-center justify-center rounded-md bg-white p-md shadow-soft">
        <ActivityIndicator
          size="large"
          color={PRIMARY_COLOR}
          accessibilityLabel={accessibilityLabel ?? 'loading-indicator'}
        />
        {text === 'HIDE' ? null : (
          <Text className="mt-3 text-base font-medium text-forest">{text ?? 'Loading...'}</Text>
        )}
      </View>
    </View>
  </Modal>
);

export default LoadingOverlay;
