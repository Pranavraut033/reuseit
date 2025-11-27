import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraHUD } from '~/components/identify/CameraHUD';
import { Viewfinder } from '~/components/identify/Viewfinder';
import { WasteAnalysisResults } from '~/components/waste-analysis/WasteAnalysisResults';

import { useWasteAnalysis } from '../../hooks/useWasteAnalysis';

export default function WasteAnalysisScreen() {
  const {
    cameraRef,
    isOffline,
    setIsOffline,
    isAnalyzing,
    offlineResult,
    pickedImage,
    setPickedImage,
    facing,
    setFacing,
    flash,
    setFlash,
    data,
    error,
    runInference,
    resetAnalysis,
    openAppSettings,
  } = useWasteAnalysis();

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-6">
        <Text className="mb-4 text-center text-lg text-white">
          Camera permission is required to analyze waste
        </Text>
        <TouchableOpacity className="rounded-lg bg-blue-500 px-6 py-3" onPress={openAppSettings}>
          <Text className="font-semibold text-white">Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar style="light" />

      {!pickedImage && (
        // Camera View
        <View className="flex-1">
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
          />
          <Viewfinder />
          <CameraHUD
            cameraRef={cameraRef}
            setPickedImage={setPickedImage}
            runInference={runInference}
            ready={true}
            liveMode={false}
            toggleLiveMode={() => {}}
            onFlashChange={setFlash}
            onFacingChange={setFacing}
          />

          {/* Offline Toggle */}
          <TouchableOpacity
            className="absolute left-6 top-12 rounded-full bg-black/50 p-3"
            onPress={() => setIsOffline(!isOffline)}>
            <Text className="text-sm text-white">{isOffline ? '🔌 Offline' : '🌐 Online'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {pickedImage && isAnalyzing && (
        <View className="absolute inset-0 items-center justify-center bg-black/80">
          <ActivityIndicator size="large" color="white" />
          <Text className="mt-4 text-lg text-white">Analyzing waste...</Text>
        </View>
      )}

      {/* Results */}
      {((data?.analyzeWaste && !isOffline) || (offlineResult && isOffline)) && (
        <WasteAnalysisResults
          result={isOffline ? offlineResult! : data!.analyzeWaste}
          pickedImage={pickedImage!}
          onClose={resetAnalysis}
        />
      )}

      {/* Error Display */}
      {error && (
        <View className="absolute left-4 right-4 top-12 rounded-lg bg-red-500 p-4">
          <Text className="font-semibold text-white">Analysis Error</Text>
          <Text className="mt-1 text-sm text-white">{error.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
