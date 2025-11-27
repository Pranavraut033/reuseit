import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { Toast } from 'toastify-react-native';

import { CameraHUD } from '~/components/identify/CameraHUD';
import { ImagePreview } from '~/components/identify/ImagePreview';
import { LiveModeOverlay } from '~/components/identify/LiveModeOverlay';
import { Viewfinder } from '~/components/identify/Viewfinder';
import { useWasteClassifier } from '~/ml/useWasteClassifier';

export default function ClassifyScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const {
    ready: classifierReady,
    loading: classifierLoading,
    error: classifierError,
    results: classifierResults,
    classify,
  } = useWasteClassifier();

  // Computed values for waste classification
  const ready = classifierReady;
  const loading = classifierLoading;
  const error = classifierError;
  const results = classifierResults;
  const runInference = classify;

  const toggleLiveMode = useCallback(() => {
    setLiveMode((prev) => !prev);
  }, []);

  // Live mode frame capture
  useEffect(() => {
    if (!liveMode || !ready || !cameraRef.current) return;

    const interval = setInterval(async () => {
      try {
        if (cameraRef.current && ready && !loading) {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.3, // Lower quality for faster processing
            skipProcessing: true,
          });
          if (photo) {
            classify(photo.uri);
          }
        }
      } catch (err) {
        console.error('Live mode frame capture failed:', err);
      }
    }, 300); // Capture every 300ms for smoother live mode

    return () => clearInterval(interval);
  }, [liveMode, ready, loading, classify]);

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
      <View className="flex-1 items-center justify-center bg-black px-6">
        <View className="rounded-xl bg-white/10 p-6 shadow-lg">
          <Text className="mb-4 text-center text-lg font-semibold text-white">
            Camera Permission Required
          </Text>
          <Text className="mb-6 text-center text-white/80">
            We need camera access to classify waste materials
          </Text>
          <TouchableOpacity
            className="rounded-lg bg-blue-600 px-6 py-3 shadow-md"
            onPress={permission.canAskAgain ? requestPermission : openAppSettings}>
            <Text className="text-center font-semibold text-white">
              {permission.canAskAgain ? 'Grant Permission' : 'Open Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (pickedImage) {
    return (
      <ImagePreview
        pickedImage={pickedImage}
        setPickedImage={setPickedImage}
        ready={ready}
        loading={loading}
        error={error}
        results={results}
        detectionMode="classification"
        runInference={runInference}
      />
    );
  }

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="rgba(0,0,0,0.5)" />
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          facing={facing}
          style={StyleSheet.absoluteFill}
          flash={flash}
          ratio="16:9"
          animateShutter={false}
        />
        {/* Middle Frame Overlay */}
        <Viewfinder />

        <CameraHUD
          cameraRef={cameraRef}
          setPickedImage={setPickedImage}
          runInference={runInference}
          ready={ready}
          liveMode={liveMode}
          toggleLiveMode={toggleLiveMode}
          onFlashChange={setFlash}
          onFacingChange={setFacing}
        />

        {/* Live Mode Results Overlay */}
        {liveMode && results && (
          <LiveModeOverlay results={results} detectionMode="classification" loading={loading} />
        )}
      </View>
    </>
  );
}
