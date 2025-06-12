import React, { ComponentProps, use, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
  Platform,
  ToastAndroid,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome6, MaterialIcons, Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
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
        }}></CameraUI>

      <Viewfinder />
    </View>
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
      // Handle the captured photo (e.g., navigate or preview)
      console.log('Captured photo:', photo);

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

// Animated Google Lens-like circles overlay
const LensCircles: React.FC = () => {
  const CIRCLE_COUNT = 12;
  const { width, height } = useWindowDimensions();
  // Keep track of used grid cells to avoid overlap
  const usedCellsRef = useRef<Set<number>>(new Set());
  const gridSize = Math.ceil(Math.sqrt(CIRCLE_COUNT));
  const cellWidth = (width - 120) / gridSize;
  const cellHeight = (height - 220) / gridSize;

  // Helper to generate a random circle config
  const randomCircle = useCallback(
    (actualIdx?: number) => {
      // Distribute circles evenly in a grid, but add some randomness for natural look
      let idx = Math.floor(Math.random() * CIRCLE_COUNT);
      let gridIdx: number;
      if (!actualIdx) {
        let attempts = 0;
        while (usedCellsRef.current.has(idx) && attempts < CIRCLE_COUNT * 2) {
          idx = Math.floor(Math.random() * CIRCLE_COUNT);
          attempts++;
        }
        usedCellsRef.current.add(idx);
        gridIdx = idx; // Use idx to determine grid position
      } else {
        const arr = Array.from(usedCellsRef.current);
        const newIdx = Math.floor(Math.random() * CIRCLE_COUNT);
        const oldIdx = arr[actualIdx!];
        const targetIndex = arr.indexOf(newIdx);
        arr[targetIndex] = oldIdx; // Swap the old index with the new one
        arr[actualIdx!] = newIdx; // Update the actual index with the new one
        usedCellsRef.current = new Set(arr);

        gridIdx = newIdx;
      }

      const col = gridIdx % gridSize;
      const row = Math.floor(gridIdx / gridSize);

      const x = 60 + col * cellWidth + Math.random() * (cellWidth * 0.5);
      const y = 110 + row * cellHeight + Math.random() * (cellHeight * 0.5);
      const size = Math.random() * 50 + 10; // Between 5 and 25
      const color = `rgba(255,255,255,${0.35 + Math.random() * 0.25})`;
      const scaleFactor = Math.random() * 0.2 + 0.1; // Between 0.1 and 0.3
      const scaleDirection = Math.random() < 0.5; // Randomly shrink or grow

      const duration = Math.random() * 1200 + 900; // Between 900ms and 2100ms
      return { x, y, gridIdx, size, scaleFactor, scaleDirection, color, duration };
    },
    [gridSize, cellWidth, cellHeight]
  );

  // State for all circles
  const [circles, setCircles] = useState(() =>
    Array.from({ length: CIRCLE_COUNT }).map(() => ({
      ...randomCircle(),
      key: Math.random().toString(36).slice(2),
      delay: Math.random() * 1000,
    }))
  );

  const onShrink = useCallback(
    (idx: number) => {
      // When shrinking, update this circle's position/size/color/duration
      setCircles((prev) => {
        const next = [...prev];
        next[idx] = {
          ...randomCircle(idx),
          key: Math.random().toString(36).slice(2),
          delay: Math.random() * 1000,
        };
        return next;
      });
    },
    [randomCircle]
  );

  // For each circle, manage its own animation state
  return (
    <>
      {circles.map((circle, idx) => (
        <LensCircle {...circle} key={circle.key} idx={idx} onShrink={onShrink} />
      ))}
    </>
  );
};

type LensCircleProps = {
  x: number;
  y: number;
  idx: number;
  size: number;
  color: string;
  delay: number;
  scaleFactor: number;
  scaleDirection: boolean; // true for grow, false for shrink
  duration: number;
  onShrink: (idx: number) => void;
  key: string;
};

const LensCircle: React.FC<LensCircleProps> = ({
  x,
  y,
  idx,
  size,
  color,
  duration,
  delay,
  scaleFactor,
  scaleDirection,
  onShrink,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onShrink(idx);
    }, duration + delay);
    return () => clearTimeout(timer);
  }, [duration, delay, onShrink, idx]);

  const [fromScale, toScale] = scaleDirection ? [1, 1 + scaleFactor] : [1 + scaleFactor, 1];
  const [fromOpacity, toOpacity] = scaleDirection ? [0.7, 1] : [1, 0.7];

  return (
    <MotiView
      from={{ scale: fromScale, opacity: fromOpacity }}
      animate={{ scale: toScale, opacity: toOpacity }}
      transition={{
        type: 'timing',
        duration,
        delay,
        loop: true,
        repeatReverse: true,
      }}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
      pointerEvents="none"
    />
  );
};
