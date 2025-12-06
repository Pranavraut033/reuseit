import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useWasteAnalysis } from '~/context/WasteAnalysisProvider';

import { ResultContent } from './ResultContent';

const ResultModal: React.FC = () => {
  const { isAnalyzing, setPickedImage, result, pickedImage, runAnalysis, error, resetAnalysis } =
    useWasteAnalysis();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const onClose = useCallback(() => {
    setPickedImage(null);
    resetAnalysis();
  }, [resetAnalysis, setPickedImage]);

  useEffect(() => {
    if (isAnalyzing || result || !pickedImage) return;

    runAnalysis();
  }, [pickedImage, runAnalysis, isAnalyzing, result]);

  return (
    <Modal visible={!!pickedImage} animationType="fade" transparent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={['50%', '90%']}
          index={1}
          onClose={onClose}
          enablePanDownToClose
          backgroundStyle={{
            backgroundColor: 'transparent',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
          handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
        >
          <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {/* Loading Overlay */}
            {pickedImage && isAnalyzing && (
              <View className="absolute inset-0 items-center justify-center bg-black/80">
                <ActivityIndicator size="large" color="white" />
                <Text className="mt-4 text-lg text-white">Analyzing waste...</Text>
              </View>
            )}
            {result &&
              pickedImage &&
              (result.detections.length === 0 ? (
                <View className="flex-1 items-center justify-center p-6">
                  <Text className="mb-4 text-center text-2xl font-bold text-white">
                    No Waste Detected
                  </Text>
                  <Text className="mb-6 text-center text-lg text-white">
                    We couldn&apos;t identify any waste items in this image. Try taking a clearer
                    photo or adjusting the angle.
                  </Text>
                  <View className="w-full flex-row justify-center space-x-4">
                    <View className="rounded-lg bg-blue-500 px-6 py-3">
                      <Text
                        className="text-center font-semibold text-white"
                        onPress={resetAnalysis}
                      >
                        Try Again
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <ResultContent />
              ))}
            {error && (
              <View className="absolute left-4 right-4 top-12 rounded-lg bg-red-500 p-4">
                <Text className="font-semibold text-white">Analysis Error</Text>
                <Text className="mt-1 text-sm text-white">{error.message}</Text>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ResultModal;
