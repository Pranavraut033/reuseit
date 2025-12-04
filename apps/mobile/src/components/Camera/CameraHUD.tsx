import { Feather, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { ComponentProps, useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FLASH_OPTIONS: FlashMode[] = ['off', 'on', 'auto'];

const FLASH_OPTION_ICONS: Record<FlashMode, ComponentProps<typeof MaterialIcons>['name']> = {
  off: 'flash-off',
  on: 'flash-on',
  auto: 'flash-auto',
};

type CameraHUDProps = {
  cameraRef: React.RefObject<CameraView | null>;
  setPickedImage: (value: string | null) => void;
  onFlashChange: (flash: FlashMode) => void;
  onFacingChange: (facing: CameraType) => void;
  moreOptions?: React.ReactNode;
};

export const CameraHUD: React.FC<CameraHUDProps> = ({
  setPickedImage,
  cameraRef,
  onFlashChange,
  onFacingChange,
  moreOptions,
}) => {
  const [flashOptionIdx, setFlashOptionsIdx] = useState(0);
  const [facing, setFacing] = useState<CameraType>('back');

  const flash = FLASH_OPTIONS[flashOptionIdx];

  const toggleFlash = useCallback(() => {
    setFlashOptionsIdx((f) => (f + 1) % FLASH_OPTIONS.length);
  }, []);

  const toggleCameraFacing = useCallback(() => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  useEffect(() => {
    onFlashChange(flash);
  }, [flash, onFlashChange]);

  useEffect(() => {
    onFacingChange(facing);
  }, [facing, onFacingChange]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      shutterSound: false,
      base64: true,
    });

    if (photo && photo.uri) {
      console.warn(`[${Date.now()}] Photo captured:`, photo.uri);
      setPickedImage(photo.uri);
    } else {
      console.warn(`[${Date.now()}] Photo capture failed or no URI:`, photo);
    }
  }, [cameraRef, setPickedImage]);

  const handlePickImage = useCallback(async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0,
    });

    if (!result.canceled && result.assets && result.assets[0] && result.assets[0].uri) {
      console.warn(`[${Date.now()}] Gallery image selected:`, result.assets[0].uri);
      setPickedImage(result.assets[0].uri);
    } else {
      console.warn(`[${Date.now()}] Gallery pick failed or no URI:`, result);
    }
  }, [setPickedImage]);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        {/* Flash & Flip Buttons */}
        <View className="absolute right-6 top-8 z-20 flex-col ">
          <TouchableOpacity
            onPress={toggleFlash}
            className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/10 p-4 shadow-xl"
            style={{ backdropFilter: 'blur(20px)' }}>
            <MaterialIcons name={FLASH_OPTION_ICONS[flash]} size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleCameraFacing}
            className="mt-4 rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/10 p-4 shadow-xl"
            style={{ backdropFilter: 'blur(20px)' }}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
          {moreOptions}
        </View>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 z-20 w-full flex-row items-center justify-center pb-12">
          {/* Gallery Button */}
          <TouchableOpacity
            onPress={handlePickImage}
            className="mx-8 rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/10 p-5 shadow-xl"
            style={{ backdropFilter: 'blur(20px)' }}>
            <MaterialIcons name="photo-library" size={28} color="white" />
          </TouchableOpacity>
          {/* Capture Button */}
          <TouchableOpacity
            onPress={handleCapture}
            className="mx-8 items-center justify-center rounded-full border-[6px] border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-2 shadow-2xl"
            style={{
              width: 90,
              height: 90,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 12,
            }}>
            <View
              className="items-center justify-center rounded-full bg-gradient-to-br from-white to-gray-100 shadow-lg"
              style={{
                width: 70,
                height: 70,
                shadowColor: '#fff',
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}>
              <Feather name="camera" size={32} color="#1f2937" />
            </View>
          </TouchableOpacity>
          {/* History Button */}
          <TouchableOpacity
            className="mx-8 rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/10 p-5 shadow-xl"
            style={{ backdropFilter: 'blur(20px)' }}>
            <FontAwesome6 solid name="clock-rotate-left" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
