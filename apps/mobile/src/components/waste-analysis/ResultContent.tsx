import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWasteAnalysis } from '~/context/WasteAnalysisProvider';
import { IMAGE_SIZE } from '~/ml/objectDetector';

type ResultContentProps = {};

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

export const ResultContent: React.FC<ResultContentProps> = () => {
  const { aiInsightsLoading, pickedImage, result, resetAnalysis } = useWasteAnalysis();

  if (!result || !pickedImage) return null;

  console.log({ a: result.detections[0].bbox });

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
              className="size-12 rounded-full bg-gray-700 p-3 shadow-lg"
              onPress={() => {
                resetAnalysis();
              }}>
              <Text className="m-auto text-sm text-white">✕</Text>
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
                      left: `${(x1 / IMAGE_SIZE) * 100}%`,
                      top: `${(y1 / IMAGE_SIZE) * 100}%`,
                      width: `${((x2 - x1) / IMAGE_SIZE) * 100}%`,
                      height: `${((y2 - y1) / IMAGE_SIZE) * 100}%`,
                      borderWidth: 3,
                      borderColor: '#00d4ff',
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      borderRadius: 12,
                    }}>
                    <LinearGradient
                      colors={['#00d4ff', '#0099cc']}
                      className="absolute -top-8 left-0 rounded-full px-3 py-1">
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
                className="mb-4 rounded-2xl border border-green-500/20 p-6 backdrop-blur-lg">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-white">{item.item_name}</Text>
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    className="rounded-full px-3 py-1">
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
                  className="mb-3 rounded-xl border border-yellow-500/20 p-3">
                  <Text className="font-semibold text-yellow-400">
                    🇩🇪 German Bin: {item.german_bin}
                  </Text>
                  {item.is_pfand && (
                    <Text className="mt-1 text-sm text-yellow-300">
                      💰 Deposit bottle (Pfand) - Earn money!
                    </Text>
                  )}
                </LinearGradient>

                <Text className="mb-3 text-sm font-medium text-gray-200">
                  📋 Recycling Instructions:
                </Text>
                <Text className="mb-3 text-sm text-gray-200">{item.recycling_instructions}</Text>

                {item.preparation_steps && item.preparation_steps.length > 0 && (
                  <View className="mb-3">
                    <Text className="mb-2 text-sm font-medium text-gray-200">
                      🔧 Preparation Steps:
                    </Text>
                    {item.preparation_steps.map((step, stepIndex) => (
                      <Text key={stepIndex} className="mb-1 text-sm text-gray-300">
                        • {step}
                      </Text>
                    ))}
                  </View>
                )}

                <Text className="mb-3 text-sm italic text-green-300">
                  ♻️ Reuse ideas: {item.reuse_ideas}
                </Text>

                {item.environmental_benefits && (
                  <LinearGradient
                    colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
                    className="mb-3 rounded-xl border border-green-500/20 p-3">
                    <Text className="text-sm text-green-300">🌱 {item.environmental_benefits}</Text>
                  </LinearGradient>
                )}
                {aiInsightsLoading && (
                  <Text className="text-sm italic text-gray-400">Loading AI insights...</Text>
                )}
                {item.ai_insights && (
                  <View className="mt-4">
                    <LinearGradient
                      colors={['rgba(147, 51, 234, 0.15)', 'rgba(147, 51, 234, 0.08)']}
                      className="rounded-2xl border border-purple-500/30 p-4 backdrop-blur-lg">
                      <View className="mb-3 flex-row items-center">
                        <Text className="mr-2 text-lg">🤖</Text>
                        <Text className="text-sm font-semibold text-purple-300">AI Insights</Text>
                      </View>

                      {item.ai_insights.simplified_summary && (
                        <Text className="mb-3 text-sm leading-relaxed text-purple-100">
                          {item.ai_insights.simplified_summary}
                        </Text>
                      )}

                      {item.ai_insights.extra_facts && item.ai_insights.extra_facts.length > 0 && (
                        <View className="space-y-2">
                          <Text className="text-xs font-medium uppercase tracking-wide text-purple-300">
                            Did You Know?
                          </Text>
                          {item.ai_insights.extra_facts.map((fact, factIndex) => (
                            <View key={factIndex} className="flex-row items-start">
                              <Text className="mr-2 mt-0.5 text-xs text-purple-400">💡</Text>
                              <Text className="flex-1 text-xs leading-relaxed text-purple-200">
                                {fact}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                )}
              </LinearGradient>
            ))}
          </View>

          <View className="mx-6 mb-6">
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              className="rounded-2xl border border-white/10 p-6 backdrop-blur-lg">
              <View className="mb-4 flex-row items-center">
                <Text className="mr-2 text-xl">⚡</Text>
                <Text className="text-xl font-bold text-white">Performance</Text>
              </View>
              <View className="mb-4 flex-row justify-between">
                <View className="items-center">
                  <Text className="text-sm text-gray-300">Vision Model</Text>
                  <Text className="text-sm font-semibold text-cyan-400">TF Lite</Text>
                </View>
                {result?.recycling_plan[0].ai_insights && (
                  <View className="items-center">
                    <Text className="text-sm text-gray-300">LLM Model</Text>
                    <Text className="text-sm font-semibold text-purple-400">qwen2.5:0.5b</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Encouragement */}
          <View className="mx-6 mb-6">
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.1)']}
              className="rounded-2xl border border-purple-500/20 p-6 backdrop-blur-lg">
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
