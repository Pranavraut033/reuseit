import { CameraView } from 'expo-camera';
import { useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useCameraPermission } from '~/hooks/useCameraPermission';

import { CameraHUD } from '../identify/CameraHUD';
import { Viewfinder } from '../identify/Viewfinder';
import { Button } from './Button';

type Props = {
  onImageClick: (value: string | null) => void;
};

const Camera: React.FC<Props> = ({ onImageClick }) => {
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const cameraRef = useRef<CameraView>(null);
  const { hasPermission, openAppSettings } = useCameraPermission();

  if (hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-6">
        <Text className="mb-4 text-center text-lg text-white">
          Camera permission is required to use the camera
        </Text>
        <TouchableOpacity className="rounded-lg bg-blue-500 px-6 py-3" onPress={openAppSettings}>
          <Text className="font-semibold text-white">Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <RequestPermissionModal />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />
      <Viewfinder />
      <CameraHUD
        cameraRef={cameraRef}
        setPickedImage={onImageClick}
        onFlashChange={setFlash}
        onFacingChange={setFacing}
      />
    </>
  );
};

// Request permission when the component mounts
const RequestPermissionModal: React.FC = () => {
  const { hasPermission, requestCameraPermission } = useCameraPermission();

  return (
    <Modal visible={!hasPermission} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/80 p-6">
        <Text className="mb-4 text-center text-lg text-white">
          {`Camera permission is required to use the camera.`}
        </Text>
        <Button onPress={requestCameraPermission}>
          <Text className="font-semibold text-white">Grant Permission</Text>
        </Button>
      </View>
    </Modal>
  );
};

export default Camera;
