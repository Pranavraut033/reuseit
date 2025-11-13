import React from 'react';
import { View, ActivityIndicator, Modal, Text } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

const PRIMARY_COLOR = '#fff'; // Replace with your primary color if different

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, text }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
    <View className={'flex-1 items-center justify-center bg-black/50'}>
      <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      {text === 'HIDE' ? null : (
        <Text className="mt-4 text-base font-medium text-white">{text ?? 'Loading...'}</Text>
      )}
    </View>
  </Modal>
);

export default LoadingOverlay;
