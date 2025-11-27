import { LinearGradient } from 'expo-linear-gradient';
import ms from 'ms';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyzeWasteResult } from '~/__generated__/graphql';

type WasteAnalysisResultsProps = {
  result: AnalyzeWasteResult;
  pickedImage: string;
  onClose: () => void;
};

const formatTime = (msValue: number) => ms(Math.round(msValue * 1000) / 1000, { long: false });

const categoryMap: Record<string, string> = {
  paper_cardboard: 'Paper & Cardboard',
  glass: 'Glass',
  recyclables: 'Recyclables',
  bio_waste: 'Bio Waste',
  textile_reuse: 'Textile & Reuse',
  electronics: 'Electronics',
  battery: 'Battery',
  residual_waste: 'Residual Waste',
};

const categoryIcons: Record<string, string> = {
  paper_cardboard: '📄',
  glass: '🥃',
  recyclables: '♻️',
  bio_waste: '🌱',
  textile_reuse: '👕',
  electronics: '🔌',
  battery: '🔋',
  residual_waste: '🗑️',
};

export const WasteAnalysisResults: React.FC<WasteAnalysisResultsProps> = ({
  result,
  pickedImage,
  onClose,
}) => {
  return (
    <SafeAreaView className="flex-1">
      <LinearGradient colors={['#0f0f23', '#1a1a2e', '#16213e']} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-6">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white">🚀 Analysis Complete!</Text>
              <Text className="mt-1 text-sm text-gray-300">Your eco-journey continues</Text>
            </View>
            <TouchableOpacity
              className="rounded-full size-12 bg-gray-700 p-3 shadow-lg"
              onPress={onClose}
            >
              <Text className="text-sm m-auto text-white">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Image Section */}
          <View className="mx-6 mb-6 overflow-hidden rounded-2xl shadow-2xl">
            <View className="relative">
              <Image source={{ uri: pickedImage }} className="h-64 w-full" resizeMode="cover" />
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
                      borderColor: '#00d4ff',
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      borderRadius: 12,
                    }}
                  >
                    <LinearGradient
                      colors={['#00d4ff', '#0099cc']}
                      className="absolute -top-8 left-0 rounded-full px-3 py-1"
                    >
                      <Text className="text-xs font-bold text-white">
                        {detection.name} {(detection.confidence * 100).toFixed(0)}%
                      </Text>
                    </LinearGradient>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Performance Card */}

          {/* Recycling Guide */}
          <View className="mx-6 mb-6">
            <View className="mb-4 flex-row items-center">
              <Text className="mr-2 text-xl">♻️</Text>
              <Text className="text-xl font-bold text-white">Recycling Guide</Text>
            </View>
            {result.recycling_plan.map((item, index) => (
              <LinearGradient
                key={index}
                colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
                className="mb-4 rounded-2xl border border-green-500/20 p-6 backdrop-blur-lg"
              >
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-white">{item.item_name}</Text>
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    className="rounded-full px-3 py-1"
                  >
                    <Text className="text-sm font-bold text-white">🌟 +10 Eco Points</Text>
                  </LinearGradient>
                </View>

                <View className="mb-3 flex-row">
                  <View className="mr-2 flex-1">
                    <Text className="text-sm text-gray-300">Material</Text>
                    <Text className="text-sm font-semibold text-green-400">
                      {item.material_type}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-300">Category</Text>
                    <View className="flex-row items-center">
                      <Text className="mr-1 text-sm">{categoryIcons[item.category] || '❓'}</Text>
                      <Text className="text-sm font-semibold text-blue-400">
                        {categoryMap[item.category] || item.category}
                      </Text>
                    </View>
                  </View>
                </View>

                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)']}
                  className="mb-3 rounded-xl border border-yellow-500/20 p-3"
                >
                  <Text className="font-semibold text-yellow-400">
                    🇩🇪 German Bin: {item.german_bin}
                  </Text>
                  {item.is_pfand && (
                    <Text className="mt-1 text-sm text-yellow-300">
                      💰 Deposit bottle (Pfand) - Earn money!
                    </Text>
                  )}
                </LinearGradient>

                <Text className="mb-3 text-sm text-gray-200">{item.recycling_instructions}</Text>

                <Text className="mb-3 text-sm italic text-green-300">
                  ♻️ Reuse ideas: {item.reuse_ideas}
                </Text>

                {item.notes_germany && (
                  <LinearGradient
                    colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.1)']}
                    className="rounded-xl border border-blue-500/20 p-3"
                  >
                    <Text className="text-sm text-blue-300">ℹ️ {item.notes_germany}</Text>
                  </LinearGradient>
                )}
              </LinearGradient>
            ))}
          </View>

          <View className="mx-6 mb-6">
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              className="rounded-2xl border border-white/10 p-6 backdrop-blur-lg"
            >
              <View className="mb-4 flex-row items-center">
                <Text className="mr-2 text-xl">⚡</Text>
                <Text className="text-xl font-bold text-white">Performance</Text>
              </View>
              <View className="mb-4 flex-row justify-between">
                <View className="items-center">
                  <Text className="text-sm text-gray-300">Vision Model</Text>
                  <Text className="text-sm font-semibold text-cyan-400">
                    {result.models.vision}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-sm text-gray-300">LLM Model</Text>
                  <Text className="text-sm font-semibold text-purple-400">{result.models.llm}</Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-cyan-400">
                    {formatTime(result.latency_ms.detector)}
                  </Text>
                  <Text className="text-sm text-gray-300">Detection</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-purple-400">
                    {formatTime(result.latency_ms.reasoner)}
                  </Text>
                  <Text className="text-sm text-gray-300">Reasoning</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-green-400">
                    {formatTime(result.latency_ms.total)}
                  </Text>
                  <Text className="text-sm text-gray-300">Total</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Encouragement */}
          <View className="mx-6 mb-6">
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.1)']}
              className="rounded-2xl border border-purple-500/20 p-6 backdrop-blur-lg"
            >
              <Text className="mb-2 text-center text-2xl font-bold text-white">🎊 Great Job!</Text>
              <Text className="text-center text-sm text-gray-300">
                You&apos;re making the planet happier! 🌍
              </Text>
              <Text className="mt-2 text-center text-sm text-purple-300">
                Keep up the amazing work! 🚀
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};
