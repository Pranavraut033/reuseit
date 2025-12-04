import { useLazyQuery } from '@apollo/client/react';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert } from 'react-native';

import { AI_INSIGHTS_QUERY } from '~/gql/queries/aiInsights';
import { useObjectDetector } from '~/hooks/useObjectDetector';
import { useWhatChanged } from '~/hooks/useWhatChanged';
import { ObjectDetectionResult } from '~/ml/objectDetector';
import { getRecyclingInfo, getWasteBin } from '~/ml/recyclingInfo';
import { AnalyzeWasteResult } from '~/types/wasteAnalysis';

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

const convertResultToAnalyzeWasteResult = (
  detectionResult: ObjectDetectionResult,
  aiInsights?: {
    extra_facts: string[];
    simplified_summary: string;
    motivation_text: string;
  },
): AnalyzeWasteResult => {
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
      german_bin: getWasteBin(det.name),
      is_pfand: false, // Simplified
      recycling_instructions: recyclingInfo.steps.join(' '),
      reuse_ideas: recyclingInfo.short,
      notes_germany: recyclingInfo.caution || '',
      preparation_steps: recyclingInfo.steps,
      environmental_benefits: 'Proper recycling reduces waste and conserves resources',
      ai_insights: aiInsights,
    };
  });

  return {
    detections,
    recycling_plan: recyclingPlan,
  };
};

// Define the context type based on the hook's return
interface WasteAnalysisContextType {
  aiInsightsLoading: boolean;
  error: any;
  isAnalyzing: boolean;
  isOffline: boolean;
  modalReady: boolean;
  pickedImage: string | null;
  resetAnalysis: () => void;
  result: AnalyzeWasteResult | undefined;
  runAnalysis: (imageUri?: string) => Promise<void>;
  setIsOffline: (value: boolean) => void;
  setPickedImage: (value: string | null) => void;
}

// Create the context
const WasteAnalysisContext = createContext<WasteAnalysisContextType | undefined>(undefined);

// Provider component
interface WasteAnalysisProviderProps {
  children: ReactNode;
}

export const WasteAnalysisProvider: React.FC<WasteAnalysisProviderProps> = ({ children }) => {
  // Ensure object detector is warmed up
  const {
    detect,
    error: detectorError,
    results,
    ready,
    reset: resetDetector,
  } = useObjectDetector();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeWasteResult>();
  const [getAIInsights, { data: aiData, error: aiError, loading: aiInsightsLoading }] =
    useLazyQuery(AI_INSIGHTS_QUERY);

  useEffect(() => {
    setResult(results ? convertResultToAnalyzeWasteResult(results, aiData?.AIInsights) : undefined);
  }, [results, aiData]);

  const runAnalysis = useCallback(
    async (imageUri?: string) => {
      const uriToUse = imageUri || pickedImage;

      if (!uriToUse) {
        Alert.alert('No Image', 'Please capture an image first');
        return;
      }

      try {
        setIsAnalyzing(true);
        let result = await detect(uriToUse);

        if (!isOffline) {
          // Online mode: run local detection first, then get AI enhancements

          if (result && result.detections.length > 0) {
            const resultHash = stringHashCode(JSON.stringify(result));
            const detection = result.detections[0];
            const maxProbIndex = detection.class.indexOf(Math.max(...detection.class));
            const category = WASTE_LABELS[maxProbIndex];
            // const recyclingInfo = getRecyclingInfo(category.replace(/_/g, ' '));

            getAIInsights({
              variables: {
                input: {
                  category,
                  resultHash,
                },
              },
            });
          }
        }
      } catch (err) {
        console.error('Analysis failed:', err);
        Alert.alert('Analysis Failed', 'Failed to analyze waste. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [pickedImage, isOffline, detect, getAIInsights],
  );

  const resetAnalysis = useCallback(() => {
    setPickedImage(null);
    setResult(undefined);
    resetDetector();
  }, [resetDetector]);

  const value: WasteAnalysisContextType = {
    isOffline,
    setIsOffline,
    isAnalyzing,
    aiInsightsLoading,
    result,
    pickedImage,
    setPickedImage,
    error: detectorError || aiError,
    runAnalysis,
    resetAnalysis,
    modalReady: ready,
  };

  // Track what changed in the context value for debugging
  useWhatChanged(value as unknown as Record<string, unknown>, 'WasteAnalysisProvider');

  return <WasteAnalysisContext.Provider value={value}>{children}</WasteAnalysisContext.Provider>;
};

// Hook to use the context
export const useWasteAnalysis = (): WasteAnalysisContextType => {
  const context = useContext(WasteAnalysisContext);
  if (!context) {
    throw new Error('useWasteAnalysis must be used within a WasteAnalysisProvider');
  }
  return context;
};

const stringHashCode = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};
