import React from 'react';
import { Text, View } from 'react-native';

import { ObjectDetectionResult } from '~/ml/objectDetector';

type DetectionResultsProps = {
  results: ObjectDetectionResult;
};

export const DetectionResults: React.FC<DetectionResultsProps> = ({ results }) => {
  if (!results?.detections?.length) return null;

  const labels = [
    'paper_cardboard',
    'glass',
    'recyclables',
    'bio_waste',
    'textile_reuse',
    'electronics',
    'battery',
    'residual_waste',
  ];

  // Get all detections with their best class
  const detections = results.detections.map(({ class: classProbs }) => {
    const maxProbIndex = classProbs.indexOf(Math.max(...classProbs));
    return {
      label: labels[maxProbIndex].replace(/_/g, ' '),
      confidence: classProbs[maxProbIndex],
    };
  });

  // Group by label and count
  const groupedDetections = detections.reduce<
    Record<string, { count: number; totalConfidence: number }>
  >((acc, detection) => {
    const key = detection.label;
    if (!acc[key]) {
      acc[key] = { count: 0, totalConfidence: 0 };
    }
    acc[key].count += 1;
    acc[key].totalConfidence += detection.confidence;
    return acc;
  }, {});

  const summaryItems = Object.entries(groupedDetections).map(([label, data]) => ({
    label,
    count: data.count,
    avgConfidence: data.totalConfidence / data.count,
  }));

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full bg-emerald-500" />
        <Text className="text-lg font-semibold text-white">
          Found {detections.length} item{detections.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View className="gap-2">
        {summaryItems.map((item) => (
          <View
            key={item.label}
            className="flex-row items-center justify-between rounded-xl bg-white/10 p-3">
            <View className="flex-row items-center gap-3">
              <View className="h-3 w-3 rounded-full bg-emerald-400" />
              <Text className="font-medium capitalize text-white">{item.label}</Text>
              {item.count > 1 && (
                <View className="rounded-full bg-blue-500/20 px-2 py-1">
                  <Text className="text-xs font-medium text-blue-300">{item.count}</Text>
                </View>
              )}
            </View>
            <Text className="font-semibold text-emerald-300">
              {(item.avgConfidence * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 p-3">
        <Text className="text-center text-sm text-white/90">
          🎯 Objects detected with AI precision
        </Text>
      </View>
    </View>
  );
};
