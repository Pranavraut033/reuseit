import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { AnalyzeWasteResult } from '~/__generated__/graphql';

type WasteAnalysisResultsProps = {
  result: AnalyzeWasteResult;
  pickedImage: string;
  onClose: () => void;
};

export const WasteAnalysisResults: React.FC<WasteAnalysisResultsProps> = ({
  result,
  pickedImage,
  onClose,
}) => {
  return (
    <View className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white/80 p-4 shadow-lg backdrop-blur">
        <Text className="text-xl font-bold text-gray-800">🎉 Analysis Complete!</Text>
        <TouchableOpacity className="rounded-full bg-gray-500 p-2" onPress={onClose}>
          <Text className="text-white">✕</Text>
        </TouchableOpacity>
      </View>

      {/* Image with Overlays */}
      <View className="relative flex-1">
        <Image source={{ uri: pickedImage }} className="flex-1" resizeMode="contain" />
        {/* Bounding Boxes */}
        {result.detections.map((detection, index) => {
          if (!detection.bbox) return null;
          const [x1, y1, x2, y2] = detection.bbox;
          return (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: `${x1 * 100}%`,
                top: `${y1 * 100}%`,
                width: `${(x2 - x1) * 100}%`,
                height: `${(y2 - y1) * 100}%`,
                borderWidth: 3,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
              }}>
              <View
                style={{
                  position: 'absolute',
                  top: -30,
                  left: 0,
                  backgroundColor: '#10b981',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}>
                <Text className="text-xs font-semibold text-white">
                  {detection.name} {(detection.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Gamified Results Panel */}
      <View className="max-h-1/2 rounded-t-3xl bg-white/90 p-6 shadow-2xl backdrop-blur">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Performance */}
          <View className="mb-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4">
            <Text className="mb-2 text-lg font-bold text-gray-800">⚡ Performance</Text>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">
                Detection: {result.latency_ms.detector}ms
              </Text>
              <Text className="text-sm text-gray-600">
                Reasoning: {result.latency_ms.reasoner}ms
              </Text>
              <Text className="text-sm font-bold text-blue-600">
                Total: {result.latency_ms.total}ms
              </Text>
            </View>
          </View>

          {/* Recycling Plan */}
          <Text className="mb-4 text-xl font-bold text-gray-800">♻️ Recycling Guide</Text>
          {result.recycling_plan.map((item, index) => (
            <View
              key={index}
              className="mb-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
              <View className="mb-2 flex-row items-center">
                <Text className="text-lg font-bold text-gray-800">{item.item_name}</Text>
                <View className="ml-2 rounded-full bg-green-500 px-2 py-1">
                  <Text className="text-xs text-white">🌟 Eco Points: +10</Text>
                </View>
              </View>

              <View className="mb-2 flex-row items-center">
                <Text className="text-sm text-gray-600">Material: {item.material_type}</Text>
                <Text className="ml-4 text-sm text-gray-600">Category: {item.category}</Text>
              </View>

              <View className="mb-2 rounded-lg bg-yellow-100 p-2">
                <Text className="font-semibold text-yellow-800">
                  🇩🇪 German Bin: {item.german_bin}
                </Text>
                {item.is_pfand && (
                  <Text className="text-sm text-yellow-700">
                    💰 Deposit bottle (Pfand) - Earn money!
                  </Text>
                )}
              </View>

              <Text className="mb-2 text-sm text-gray-700">{item.recycling_instructions}</Text>

              <Text className="mb-2 text-sm italic text-green-700">
                ♻️ Reuse ideas: {item.reuse_ideas}
              </Text>

              {item.notes_germany && (
                <View className="rounded-lg bg-blue-50 p-2">
                  <Text className="text-sm text-blue-700">ℹ️ {item.notes_germany}</Text>
                </View>
              )}
            </View>
          ))}

          {/* Encouragement */}
          <View className="mt-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4">
            <Text className="text-center text-lg font-bold text-gray-800">🎊 Great Job!</Text>
            <Text className="text-center text-sm text-gray-600">
              You&apos;re making the planet happier! 🌍
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
