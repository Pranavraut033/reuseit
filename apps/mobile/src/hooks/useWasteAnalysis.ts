import { useLazyQuery } from '@apollo/client/react';
import { CameraView } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { AnalyzeWasteResult } from '~/__generated__/graphql';
import { ANALYZE_WASTE } from '~/gql/mutations/analyzeWaste';
import { detectObjects } from '~/ml/objectDetector';
import { getRecyclingInfo } from '~/ml/recyclingInfo';

const WASTE_LABELS = [
  'paper_cardboard',
  'glass',
  'recyclables',
  'bio_waste',
  'textile_reuse',
  'electronics',
  'battery',
  'residual_waste',
];

const performOfflineAnalysis = async (imageUri: string): Promise<AnalyzeWasteResult> => {
  // Offline mode: use local object detection
  const detectionResult = await detectObjects(imageUri);

  // Process detections
  const detections = detectionResult.detections.map((det) => {
    const maxProbIndex = det.class.indexOf(Math.max(...det.class));
    const label = WASTE_LABELS[maxProbIndex];
    const confidence = det.class[maxProbIndex];

    return {
      name: label.replace(/_/g, ' '),
      confidence,
      class_id: maxProbIndex,
      bbox: det.bbox,
    };
  });

  // Generate recycling plan
  const recyclingPlan = detections.map((det) => {
    const recyclingInfo = getRecyclingInfo(det.name);

    return {
      item_name: det.name,
      material_type: det.name, // Simplified
      category: det.name,
      german_bin:
        det.name === 'glass'
          ? 'Glascontainer'
          : det.name === 'paper_cardboard'
            ? 'Papiertonne'
            : det.name === 'recyclables'
              ? 'Gelbe Tonne'
              : det.name === 'bio_waste'
                ? 'Biotonne'
                : 'Restmüll',
      is_pfand: false, // Simplified
      recycling_instructions: recyclingInfo.steps.join(' '),
      reuse_ideas: recyclingInfo.short,
      notes_germany: recyclingInfo.caution || '',
    };
  });

  return {
    detections,
    recycling_plan: recyclingPlan,
    latency_ms: {
      detector: 100, // Mock
      reasoner: 50, // Mock
      total: 150, // Mock
    },
    models: {
      vision: 'TFLite Object Detector',
      llm: 'Offline Recycling DB',
    },
  };
};

const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  if (imageUri.startsWith('data:image')) {
    return imageUri.replace(/^data:image\/[a-z]+;base64,/, '');
  } else {
    // Convert file URI to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.readAsDataURL(blob);
    });
  }
};

export const useWasteAnalysis = () => {
  const cameraRef = useRef<CameraView>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [offlineResult, setOfflineResult] = useState<AnalyzeWasteResult | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');

  const [analyzeWaste, { data, error }] = useLazyQuery<{ analyzeWaste: AnalyzeWasteResult }>(
    ANALYZE_WASTE,
  );

  const handleAnalysis = useCallback(
    async (imageUri?: string) => {
      console.warn(
        `[${Date.now()}] handleAnalysis called with imageUri:`,
        imageUri,
        'pickedImage:',
        pickedImage,
      );
      const uriToUse = imageUri || pickedImage;
      console.warn(`[${Date.now()}] uriToUse:`, uriToUse);

      if (!uriToUse) {
        console.warn(`[${Date.now()}] Showing no image alert`);
        Alert.alert('No Image', 'Please capture an image first');
        return;
      }

      setIsAnalyzing(true);

      try {
        if (isOffline) {
          const offlineResult = await performOfflineAnalysis(uriToUse);
          setOfflineResult(offlineResult);
        } else {
          // Online mode: use GraphQL - convert image to base64 if needed
          let base64Data: string;
          try {
            base64Data = await convertImageToBase64(uriToUse);
          } catch (error) {
            console.error('Failed to convert image to base64:', error);
            Alert.alert('Error', 'Unable to process image');
            return;
          }

          await analyzeWaste({
            variables: {
              input: {
                imageBase64: base64Data,
                userText: userText?.trim() || undefined,
              },
            },
          });
        }
      } catch (err) {
        console.error('Analysis failed:', err);
        Alert.alert('Analysis Failed', 'Failed to analyze waste. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [pickedImage, userText, analyzeWaste, isOffline],
  );

  const runInference = useCallback(
    async (uri: string) => {
      console.warn(`[${Date.now()}] runInference called with uri:`, uri);
      if (!uri) {
        console.warn(`[${Date.now()}] runInference called with empty uri, skipping`);
        return;
      }
      // Automatically start analysis with the captured image
      await handleAnalysis(uri);
    },
    [handleAnalysis],
  );

  const resetAnalysis = useCallback(() => {
    setPickedImage(null);
    setUserText('');
    setOfflineResult(null);
    // Reset mutation state if needed
  }, []);

  const openAppSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera permission in your app settings',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              await Linking.openURL('app-settings:').catch((error) => {
                console.error('Failed to open app settings:', error);
              });
            },
          },
        ],
      );
    } else {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera permission in your app settings',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              await Linking.openSettings().catch((error) => {
                console.error('Failed to open app settings:', error);
              });
            },
          },
        ],
      );
    }
  }, []);

  return {
    // Refs
    cameraRef,

    // States
    isOffline,
    setIsOffline,
    isAnalyzing,
    offlineResult,
    pickedImage,
    setPickedImage,
    userText,
    setUserText,
    facing,
    setFacing,
    flash,
    setFlash,
    data,
    error,

    // Functions
    runInference,
    handleAnalysis,
    resetAnalysis,
    openAppSettings,
  };
};
