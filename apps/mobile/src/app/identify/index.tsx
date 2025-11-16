import { Feather,FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode,useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import React, { ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { Toast } from 'toastify-react-native';

const FLASH_OPTIONS: FlashMode[] = ['off', 'on', 'auto'];
const FLASH_OPTION_ICONS: Record<FlashMode, ComponentProps<typeof MaterialIcons>['name']> = {
  off: 'flash-off',
  on: 'flash-on',
  auto: 'flash-auto',
};
export default function IdentifyScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOptionIdx, setFlashOptionsIdx] = useState<number>(0);
  const [pickedImage, setPickedImage] = useState<string | null>(null);

  const toggleFlash = useCallback(() => {
    setFlashOptionsIdx((f) => (f + 1) % FLASH_OPTIONS.length);
  }, []);
  const flash = FLASH_OPTIONS[flashOptionIdx];

  const toggleCameraFacing = useCallback(() => {
    setFacing((facing) => (facing === 'back' ? 'front' : 'back'));
  }, []);

  const openAppSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Toast.info('Please enable camera permission in your app settings');
      setTimeout(async () => {
        // Open app settings after a short delay to allow the toast to show
        await Linking.openURL('app-settings:').catch((error) => {
          console.error('Failed to open app settings:', error);
        });
      }, 1000);
    } else {
      // show a native toast message for Android
      ToastAndroid.show('Please enable camera permission in your app settings', ToastAndroid.LONG);
      await Linking.openSettings().catch((error) => {
        console.error('Failed to open app settings:', error);
      }); // Android
    }
  }, []);

  useEffect(() => {
    // Request camera permission on mount
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="mb-4 text-white">We need your permission to show the camera</Text>
        <TouchableOpacity
          className="rounded bg-blue-600 px-4 py-2"
          onPress={permission.canAskAgain ? requestPermission : openAppSettings}>
          <Text className="font-bold text-white">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pickedImage) {
    return (
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 50,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.85)',
        }}>
        <Image
          source={{ uri: pickedImage }}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
          }}
        />

        <View className="rounded-full bg-white/20 p-3 shadow-lg">
          <ActivityIndicator size={32} color={'white'} />
        </View>
        {/* <LensCircles /> */}
      </View>
    );
  }
  return (
    <>
      <StatusBar style="light" translucent backgroundColor="rgba(0,0,0,0.5)" />
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          ratio="16:9"
          animateShutter={false}
        />
        {/* Middle Frame Overlay */}
        <CameraUI
          {...{
            flash,
            flashOptionIdx,
            facing,
            cameraRef,
            toggleFlash,
            toggleCameraFacing,
            setPickedImage,
          }}
        />

        <Viewfinder />
      </View>
    </>
  );
}
type CameraUIProps = {
  flashOptionIdx: number;
  flash: FlashMode;
  cameraRef: React.RefObject<CameraView | null>;
  setPickedImage: React.Dispatch<React.SetStateAction<string | null>>;
  toggleFlash: () => void;
  toggleCameraFacing: () => void;
};

const CameraUI: React.FC<CameraUIProps> = ({
  setPickedImage,
  cameraRef,
  toggleCameraFacing,
  toggleFlash,
  flash,
}) => {
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();

      if (photo) {
        setPickedImage(photo.uri);
        // Optionally navigate to a detail screen with the captured photo
        // router.push(`/identify/detail?photo=${encodeURIComponent(photo.uri)}`);
      }
    }
  }, [cameraRef, setPickedImage]);

  const handlePickImage = useCallback(async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
    }
  }, [setPickedImage]);

  return (
    <>
      {/* Flash & Flip Buttons */}
      <View className="absolute right-6 top-8 flex-row space-x-4">
        <TouchableOpacity
          onPress={toggleFlash}
          className="mr-2 rounded-full border border-white/30 bg-white/20 p-3 shadow-lg"
          style={{ backdropFilter: 'blur(10px)' }}>
          <MaterialIcons name={FLASH_OPTION_ICONS[flash]} size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleCameraFacing}
          className="rounded-full border border-white/30 bg-white/20 p-3 shadow-lg"
          style={{ backdropFilter: 'blur(10px)' }}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {/* Bottom Controls */}
      <View className="absolute bottom-0 w-full flex-row items-center justify-center pb-12">
        {/* Gallery Button */}
        <TouchableOpacity
          onPress={handlePickImage}
          className="mx-8 rounded-full border border-white/30 bg-white/20 p-4 shadow-lg"
          style={{ backdropFilter: 'blur(10px)' }}>
          <MaterialIcons name="photo-library" size={28} color="white" />
        </TouchableOpacity>
        {/* Capture Button */}
        <TouchableOpacity
          onPress={handleCapture}
          className="mx-8 items-center justify-center rounded-full border-[6px] border-white/70 bg-white p-2"
          style={{
            width: 80,
            height: 80,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <View
            className="items-center justify-center rounded-full bg-white"
            style={{
              width: 64,
              height: 64,
              shadowColor: '#fff',
              shadowOpacity: 0.2,
              shadowRadius: 10,
            }}>
            <Feather name="camera" size={32} color="#222" />
          </View>
        </TouchableOpacity>
        {/* History Button */}
        <TouchableOpacity
          // onPress={() => router.push('/history')}
          className="mx-8 rounded-full border border-white/30 bg-white/20 p-4 shadow-lg"
          style={{ backdropFilter: 'blur(10px)' }}>
          <FontAwesome6 solid name="clock-rotate-left" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );
};

const Viewfinder: React.FC = () => {
  return (
    <View
      style={{
        width: 160,
        height: 160,
        transform: [{ translateX: -80 }, { translateY: -110 }],
        position: 'absolute',
      }}
      className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transform">
      <MotiView
        pointerEvents="none"
        style={{
          width: 160,
          height: 160,
        }}
        from={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.1, opacity: 0.75 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          repeatReverse: true,
        }}>
        {/* Top Left Corner */}
        <View
          className="absolute left-0 top-0 h-10 w-10 rounded-tl-[10px]"
          style={{
            borderTopWidth: 4,
            borderLeftWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
        {/* Top Right Corner */}
        <View
          className="absolute right-0 top-0 h-10 w-10 rounded-tr-[10px]"
          style={{
            borderTopWidth: 4,
            borderRightWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
        {/* Bottom Left Corner */}
        <View
          className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-[10px]"
          style={{
            borderBottomWidth: 4,
            borderLeftWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
        {/* Bottom Right Corner */}
        <View
          className="absolute bottom-0 right-0 h-10 w-10 rounded-br-[10px]"
          style={{
            borderBottomWidth: 4,
            borderRightWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
      </MotiView>
    </View>
  );
};
