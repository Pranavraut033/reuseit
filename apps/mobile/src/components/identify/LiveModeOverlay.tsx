import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ClassificationResult } from '~/ml/classifier';
import { ObjectDetectionResult } from '~/ml/objectDetector';

type BaseLiveModeOverlayProps = {
  loading: boolean;
};

type LiveModeOverlayProps =
  | (BaseLiveModeOverlayProps & {
      detectionMode: 'classification';
      results: ClassificationResult[];
    })
  | (BaseLiveModeOverlayProps & {
      detectionMode: 'detection';
      results: ObjectDetectionResult | null;
    });

export const LiveModeOverlay: React.FC<LiveModeOverlayProps> = ({
  results,
  detectionMode,
  loading,
}) => {
  if (detectionMode === 'classification') {
    return (
      <View className="absolute left-0 right-0 top-20 z-20 mx-6">
        <View className="rounded-2xl border border-white/10 bg-black/80 p-5 shadow-2xl backdrop-blur-lg">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <Text className="text-lg font-bold text-white">Live Classification</Text>
            </View>
            {loading && <ActivityIndicator size="small" color="#10b981" />}
          </View>
          <View className="gap-2">
            {results.slice(0, 3).map((r) => (
              <View
                key={r.label}
                className="flex-row items-center justify-between rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3">
                <Text className="font-medium capitalize text-white">
                  {r.label.replace(/_/g, ' ')}
                </Text>
                <View className="rounded-full bg-emerald-500/20 px-3 py-1">
                  <Text className="text-sm font-bold text-emerald-300">
                    {(r.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // detectionMode === 'detection'
  return (
    <View className="absolute left-0 right-0 top-20 z-20 mx-6">
      <View className="rounded-2xl border border-white/10 bg-black/80 p-5 shadow-2xl backdrop-blur-lg">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <Text className="text-lg font-bold text-white">Live Detection</Text>
          </View>
          {loading && <ActivityIndicator size="small" color="#3b82f6" />}
        </View>
        <View className="gap-2">
          <View className="flex-row items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 p-3">
            <View className="h-3 w-3 rounded-full bg-emerald-400" />
            <Text className="font-medium text-white">
              {results?.detections?.length || 0} objects detected
            </Text>
          </View>
          <View className="rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3">
            <Text className="text-center text-sm text-white/90">
              🎯 Real-time AI analysis active
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
