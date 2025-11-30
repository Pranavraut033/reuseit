import { StatusBar } from 'expo-status-bar';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import Camera from '~/components/common/Camera';
import ResultModal from '~/components/waste-analysis/ResultModal';
import { useWasteAnalysis, WasteAnalysisProvider } from '~/context/WasteAnalysisProvider';

function WasteAnalysisContent() {
  const { setPickedImage, pickedImage, isOffline, setIsOffline } = useWasteAnalysis();

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
            <Camera onImageClick={setPickedImage} />

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
