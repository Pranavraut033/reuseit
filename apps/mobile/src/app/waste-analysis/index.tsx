import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import Camera from '~/components/Camera';
import ResultModal from '~/components/waste-analysis/ResultModal';
import { useWasteAnalysis, WasteAnalysisProvider } from '~/context/WasteAnalysisProvider';
import { Detection } from '~/utils/wasteAnalysis';

function WasteAnalysisContent() {
  const { setPickedImage, pickedImage, isOffline, setIsOffline } = useWasteAnalysis();
  const [detections, setDetections] = useState<Detection[]>([]);

  const handleDetections = (newDetections: Detection[]) => {
    setDetections(newDetections);
  };

  return (
    <>
      <StatusBar style="light" />

      <View className="flex-1">
        {pickedImage ? (
          // blur
          <View className="absolute inset-0 z-10 items-center justify-center bg-black/70 p-6">
            <Image
              source={{ uri: pickedImage }}
              className="absolute inset-0 rounded-lg"
              style={{ resizeMode: 'cover' }}
              blurRadius={30}
            />
          </View>
        ) : (
          <>
            <Camera onImageClick={setPickedImage} onDetections={handleDetections} />

            {/* Bounding Boxes */}
            {detections.map((det, index) => (
              <View
                key={index}
                className="absolute border-2 border-green-500"
                style={{
                  left: det.bbox[0],
                  top: det.bbox[1],
                  width: det.bbox[2] - det.bbox[0],
                  height: det.bbox[3] - det.bbox[1],
                }}>
                <Text className="absolute -top-6 left-0 bg-green-500 px-1 text-xs text-white">
                  {det.confidence.toFixed(2)}
                </Text>
              </View>
            ))}

            {/* Offline Toggle */}
            <View className="absolute left-0 right-0 top-12 items-center">
              <TouchableOpacity
                className="rounded-full bg-black/50 px-4 py-2"
                onPress={() => setIsOffline(!isOffline)}>
                <Text className="text-sm font-medium text-white">
                  {isOffline ? '🔌 Offline' : '🌐 Online'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <ResultModal />
      </View>
    </>
  );
}

const WasteAnalysisScreen: React.FC = () => {
  return (
    <WasteAnalysisProvider>
      <WasteAnalysisContent />
    </WasteAnalysisProvider>
  );
};

export default WasteAnalysisScreen;
